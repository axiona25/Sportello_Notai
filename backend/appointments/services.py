"""
Servizi per la gestione degli appuntamenti e calcolo disponibilità.
"""
from datetime import datetime, time, timedelta, date
from typing import List, Dict, Optional
from django.db.models import Q
from django.utils import timezone

from .models import (
    Appuntamento, DisponibilitaNotaio, EccezioneDisponibilita,
    AppointmentStatus, PartecipanteAppuntamento, ParticipantStatus
)
from accounts.models import Notaio, Cliente, Partner


class SlotDisponibile:
    """Rappresenta uno slot di tempo disponibile."""
    
    def __init__(self, start: datetime, end: datetime, notaio: Notaio):
        self.start = start
        self.end = end
        self.notaio = notaio
        self.duration_minutes = int((end - start).total_seconds() / 60)
    
    def to_dict(self):
        return {
            'start': self.start.isoformat(),
            'end': self.end.isoformat(),
            'duration_minutes': self.duration_minutes,
            'notaio_id': str(self.notaio.id),
            'notaio_nome': self.notaio.nome_completo,
        }


class DisponibilitaService:
    """
    Servizio per calcolare gli slot disponibili del notaio.
    Considera:
    - Disponibilità standard del notaio
    - Eccezioni (ferie, chiusure)
    - Appuntamenti già prenotati
    """
    
    @staticmethod
    def get_slots_disponibili(
        notaio: Notaio,
        data_inizio: date,
        data_fine: date,
        durata_minuti: int = 60
    ) -> List[SlotDisponibile]:
        """
        Calcola tutti gli slot disponibili per un notaio in un periodo.
        
        Args:
            notaio: Il notaio
            data_inizio: Data inizio ricerca
            data_fine: Data fine ricerca
            durata_minuti: Durata desiderata dello slot
        
        Returns:
            Lista di SlotDisponibile
        """
        slots = []
        current_date = data_inizio
        
        # Mappa giorni settimana
        giorni_map = {
            0: 'lunedi',
            1: 'martedi',
            2: 'mercoledi',
            3: 'giovedi',
            4: 'venerdi',
            5: 'sabato',
            6: 'domenica',
        }
        
        while current_date <= data_fine:
            giorno_settimana = giorni_map[current_date.weekday()]
            
            # Ottieni disponibilità per questo giorno
            disponibilita = DisponibilitaNotaio.objects.filter(
                notaio=notaio,
                giorno_settimana=giorno_settimana,
                is_active=True,
                permetti_prenotazioni_online=True,
                data_inizio_validita__lte=current_date
            ).filter(
                Q(data_fine_validita__isnull=True) | Q(data_fine_validita__gte=current_date)
            )
            
            for disp in disponibilita:
                # Verifica se c'è un'eccezione per questo giorno
                if DisponibilitaService._ha_eccezione_chiusura(notaio, current_date):
                    continue
                
                # Genera slot per questa fascia oraria
                day_slots = DisponibilitaService._genera_slots_per_fascia(
                    notaio=notaio,
                    data=current_date,
                    ora_inizio=disp.ora_inizio,
                    ora_fine=disp.ora_fine,
                    durata_slot=durata_minuti
                )
                
                slots.extend(day_slots)
            
            current_date += timedelta(days=1)
        
        # Filtra slot già occupati
        slots_liberi = DisponibilitaService._filtra_slots_occupati(notaio, slots)
        
        # Filtra slot nel passato
        now = timezone.now()
        slots_liberi = [s for s in slots_liberi if s.start > now]
        
        return slots_liberi
    
    @staticmethod
    def _genera_slots_per_fascia(
        notaio: Notaio,
        data: date,
        ora_inizio: time,
        ora_fine: time,
        durata_slot: int
    ) -> List[SlotDisponibile]:
        """Genera tutti gli slot possibili in una fascia oraria."""
        slots = []
        
        # Combina data e ora
        start_datetime = timezone.make_aware(
            datetime.combine(data, ora_inizio)
        )
        end_datetime = timezone.make_aware(
            datetime.combine(data, ora_fine)
        )
        
        current_start = start_datetime
        delta = timedelta(minutes=durata_slot)
        
        while current_start + delta <= end_datetime:
            current_end = current_start + delta
            
            slots.append(SlotDisponibile(
                start=current_start,
                end=current_end,
                notaio=notaio
            ))
            
            current_start = current_end
        
        return slots
    
    @staticmethod
    def _ha_eccezione_chiusura(notaio: Notaio, data: date) -> bool:
        """Verifica se c'è una chiusura per questa data."""
        start_of_day = timezone.make_aware(datetime.combine(data, time.min))
        end_of_day = timezone.make_aware(datetime.combine(data, time.max))
        
        eccezioni = EccezioneDisponibilita.objects.filter(
            notaio=notaio,
            is_chiusura=True,
            data_inizio__lte=end_of_day,
            data_fine__gte=start_of_day
        )
        
        return eccezioni.exists()
    
    @staticmethod
    def _filtra_slots_occupati(
        notaio: Notaio,
        slots: List[SlotDisponibile]
    ) -> List[SlotDisponibile]:
        """Filtra gli slot già occupati da appuntamenti."""
        if not slots:
            return []
        
        # Ottieni tutti gli appuntamenti confermati/approvati nel periodo
        min_start = min(s.start for s in slots)
        max_end = max(s.end for s in slots)
        
        appuntamenti_occupati = Appuntamento.objects.filter(
            notaio=notaio,
            start_time__lt=max_end,
            end_time__gt=min_start,
            status__in=[
                AppointmentStatus.APPROVATO,
                AppointmentStatus.CONFERMATO,
                AppointmentStatus.RICHIESTO  # Considera anche le richieste in attesa
            ]
        )
        
        slots_liberi = []
        
        for slot in slots:
            # Verifica se questo slot si sovrappone con qualche appuntamento
            is_occupato = False
            
            for app in appuntamenti_occupati:
                if DisponibilitaService._slots_si_sovrappongono(
                    slot.start, slot.end,
                    app.start_time, app.end_time
                ):
                    is_occupato = True
                    break
            
            if not is_occupato:
                slots_liberi.append(slot)
        
        return slots_liberi
    
    @staticmethod
    def _slots_si_sovrappongono(
        start1: datetime, end1: datetime,
        start2: datetime, end2: datetime
    ) -> bool:
        """Verifica se due slot si sovrappongono."""
        return start1 < end2 and end1 > start2
    
    @staticmethod
    def verifica_slot_disponibile(
        notaio: Notaio,
        start_time: datetime,
        end_time: datetime
    ) -> bool:
        """
        Verifica se uno specifico slot è disponibile.
        
        Returns:
            True se lo slot è disponibile, False altrimenti
        """
        # Verifica appuntamenti esistenti
        conflitti = Appuntamento.objects.filter(
            notaio=notaio,
            start_time__lt=end_time,
            end_time__gt=start_time,
            status__in=[
                AppointmentStatus.APPROVATO,
                AppointmentStatus.CONFERMATO,
                AppointmentStatus.RICHIESTO
            ]
        )
        
        if conflitti.exists():
            return False
        
        # Verifica eccezioni (chiusure)
        eccezioni = EccezioneDisponibilita.objects.filter(
            notaio=notaio,
            is_chiusura=True,
            data_inizio__lte=end_time,
            data_fine__gte=start_time
        )
        
        if eccezioni.exists():
            return False
        
        return True


class AppuntamentoService:
    """
    Servizio per gestire il ciclo di vita degli appuntamenti.
    """
    
    @staticmethod
    def crea_richiesta_appuntamento(
        notaio: Notaio,
        cliente: Cliente,
        start_time: datetime,
        end_time: datetime,
        titolo: str,
        descrizione: str = "",
        tipo: str = "consulenza",
        **kwargs
    ) -> Appuntamento:
        """
        Crea una richiesta di appuntamento da parte del cliente.
        
        Returns:
            Appuntamento creato con status RICHIESTO
        
        Raises:
            ValueError: Se lo slot non è disponibile
        """
        # Verifica disponibilità
        if not DisponibilitaService.verifica_slot_disponibile(notaio, start_time, end_time):
            raise ValueError("Lo slot selezionato non è più disponibile")
        
        # Crea l'appuntamento
        appuntamento = Appuntamento.objects.create(
            notaio=notaio,
            status=AppointmentStatus.RICHIESTO,
            tipo=tipo,
            start_time=start_time,
            end_time=end_time,
            titolo=titolo,
            descrizione=descrizione,
            created_by_email=cliente.mail,
            **kwargs
        )
        
        # Aggiungi il cliente come partecipante
        PartecipanteAppuntamento.objects.create(
            appuntamento=appuntamento,
            cliente=cliente,
            ruolo='richiedente',
            status=ParticipantStatus.ACCETTATO  # Il cliente che richiede accetta automaticamente
        )
        
        return appuntamento
    
    @staticmethod
    def approva_appuntamento(
        appuntamento: Appuntamento,
        confermato_da: str = None
    ) -> Appuntamento:
        """
        Il notaio approva l'appuntamento richiesto dal cliente.
        
        Returns:
            Appuntamento aggiornato con status APPROVATO
        """
        if appuntamento.status != AppointmentStatus.RICHIESTO:
            raise ValueError(f"L'appuntamento deve essere in stato RICHIESTO (stato attuale: {appuntamento.status})")
        
        # Verifica ancora disponibilità
        if not DisponibilitaService.verifica_slot_disponibile(
            appuntamento.notaio,
            appuntamento.start_time,
            appuntamento.end_time
        ):
            # Escludi questo appuntamento stesso dal controllo
            conflitti = Appuntamento.objects.filter(
                notaio=appuntamento.notaio,
                start_time__lt=appuntamento.end_time,
                end_time__gt=appuntamento.start_time,
                status__in=[AppointmentStatus.APPROVATO, AppointmentStatus.CONFERMATO]
            ).exclude(id=appuntamento.id)
            
            if conflitti.exists():
                raise ValueError("Lo slot non è più disponibile")
        
        appuntamento.approva(confermato_da)
        return appuntamento
    
    @staticmethod
    def rifiuta_appuntamento(
        appuntamento: Appuntamento,
        motivo: str = None
    ) -> Appuntamento:
        """
        Il notaio rifiuta l'appuntamento richiesto dal cliente.
        """
        if appuntamento.status != AppointmentStatus.RICHIESTO:
            raise ValueError("L'appuntamento deve essere in stato RICHIESTO")
        
        appuntamento.rifiuta(motivo)
        return appuntamento
    
    @staticmethod
    def invita_partners(
        appuntamento: Appuntamento,
        partners: List[Partner],
        ruolo: str = 'invitato'
    ) -> List[PartecipanteAppuntamento]:
        """
        Il notaio invita uno o più partners all'appuntamento approvato.
        
        Returns:
            Lista dei partecipanti creati
        """
        if appuntamento.status not in [AppointmentStatus.APPROVATO, AppointmentStatus.CONFERMATO]:
            raise ValueError("L'appuntamento deve essere approvato prima di invitare partners")
        
        partecipanti_creati = []
        
        for partner in partners:
            # Verifica se il partner è già invitato
            existing = PartecipanteAppuntamento.objects.filter(
                appuntamento=appuntamento,
                partner=partner
            ).first()
            
            if existing:
                continue  # Già invitato
            
            # Crea l'invito
            partecipante = PartecipanteAppuntamento.objects.create(
                appuntamento=appuntamento,
                partner=partner,
                ruolo=ruolo,
                status=ParticipantStatus.IN_ATTESA
            )
            
            partecipanti_creati.append(partecipante)
        
        return partecipanti_creati
    
    @staticmethod
    def accetta_invito_partner(
        partecipante: PartecipanteAppuntamento,
        note: str = None
    ) -> PartecipanteAppuntamento:
        """
        Il partner accetta l'invito all'appuntamento.
        
        Raises:
            ValueError: Se ci sono conflitti nell'agenda del partner
        """
        if partecipante.status != ParticipantStatus.IN_ATTESA:
            raise ValueError("L'invito deve essere in stato IN_ATTESA")
        
        # Verifica conflitti
        conflitti = partecipante.check_conflicts()
        if conflitti:
            raise ValueError(f"Il partner ha già un appuntamento in questo orario")
        
        partecipante.accetta(note)
        
        # Controlla se tutti i partecipanti hanno accettato
        AppuntamentoService._verifica_conferma_totale(partecipante.appuntamento)
        
        return partecipante
    
    @staticmethod
    def rifiuta_invito_partner(
        partecipante: PartecipanteAppuntamento,
        note: str = None
    ) -> PartecipanteAppuntamento:
        """
        Il partner rifiuta l'invito all'appuntamento.
        """
        if partecipante.status != ParticipantStatus.IN_ATTESA:
            raise ValueError("L'invito deve essere in stato IN_ATTESA")
        
        partecipante.rifiuta(note)
        return partecipante
    
    @staticmethod
    def _verifica_conferma_totale(appuntamento: Appuntamento):
        """
        Verifica se tutti i partecipanti hanno accettato.
        Se sì, porta l'appuntamento a CONFERMATO.
        """
        if appuntamento.status != AppointmentStatus.APPROVATO:
            return
        
        partecipanti = appuntamento.partecipanti.all()
        
        # Tutti devono aver accettato
        tutti_accettato = all(
            p.status == ParticipantStatus.ACCETTATO
            for p in partecipanti
        )
        
        if tutti_accettato and partecipanti.exists():
            appuntamento.status = AppointmentStatus.CONFERMATO
            appuntamento.save()
    
    @staticmethod
    def annulla_appuntamento(
        appuntamento: Appuntamento,
        motivo: str = None
    ) -> Appuntamento:
        """
        Annulla un appuntamento.
        """
        if not appuntamento.can_be_modified():
            raise ValueError("L'appuntamento non può essere modificato")
        
        appuntamento.status = AppointmentStatus.ANNULLATO
        if motivo:
            appuntamento.note_pubbliche = f"Annullato: {motivo}"
        appuntamento.save()
        
        return appuntamento
    
    @staticmethod
    def completa_appuntamento(appuntamento: Appuntamento) -> Appuntamento:
        """
        Segna l'appuntamento come completato.
        """
        if appuntamento.status != AppointmentStatus.CONFERMATO:
            raise ValueError("L'appuntamento deve essere confermato")
        
        appuntamento.status = AppointmentStatus.COMPLETATO
        appuntamento.save()
        
        return appuntamento
    
    @staticmethod
    def get_agenda_notaio(
        notaio: Notaio,
        data_inizio: datetime,
        data_fine: datetime,
        includi_stati: List[str] = None
    ) -> List[Appuntamento]:
        """
        Ottiene tutti gli appuntamenti del notaio in un periodo.
        """
        if includi_stati is None:
            includi_stati = [
                AppointmentStatus.RICHIESTO,
                AppointmentStatus.APPROVATO,
                AppointmentStatus.CONFERMATO
            ]
        
        return Appuntamento.objects.filter(
            notaio=notaio,
            start_time__gte=data_inizio,
            start_time__lte=data_fine,
            status__in=includi_stati
        ).order_by('start_time')
    
    @staticmethod
    def get_agenda_cliente(
        cliente: Cliente,
        data_inizio: datetime,
        data_fine: datetime
    ) -> List[Appuntamento]:
        """
        Ottiene tutti gli appuntamenti del cliente in un periodo.
        """
        partecipazioni = PartecipanteAppuntamento.objects.filter(
            cliente=cliente,
            appuntamento__start_time__gte=data_inizio,
            appuntamento__start_time__lte=data_fine,
            appuntamento__status__in=[
                AppointmentStatus.RICHIESTO,
                AppointmentStatus.APPROVATO,
                AppointmentStatus.CONFERMATO
            ]
        ).select_related('appuntamento')
        
        return [p.appuntamento for p in partecipazioni]
    
    @staticmethod
    def get_agenda_partner(
        partner: Partner,
        data_inizio: datetime,
        data_fine: datetime
    ) -> List[Appuntamento]:
        """
        Ottiene tutti gli appuntamenti del partner in un periodo.
        """
        partecipazioni = PartecipanteAppuntamento.objects.filter(
            partner=partner,
            appuntamento__start_time__gte=data_inizio,
            appuntamento__start_time__lte=data_fine,
            appuntamento__status__in=[
                AppointmentStatus.APPROVATO,
                AppointmentStatus.CONFERMATO
            ]
        ).select_related('appuntamento')
        
        return [p.appuntamento for p in partecipazioni]

