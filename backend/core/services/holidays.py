"""
Gestione giorni festivi italiani e di San Marino
"""
from datetime import date, timedelta


def get_easter_date(year):
    """
    Calcola la data della Pasqua per un dato anno (algoritmo di Gauss)
    """
    a = year % 19
    b = year // 100
    c = year % 100
    d = b // 4
    e = b % 4
    f = (b + 8) // 25
    g = (b - f + 1) // 3
    h = (19 * a + b - d - g + 15) % 30
    i = c // 4
    k = c % 4
    l = (32 + 2 * e + 2 * i - h - k) % 7
    m = (a + 11 * h + 22 * l) // 451
    month = (h + l - 7 * m + 114) // 31
    day = ((h + l - 7 * m + 114) % 31) + 1
    
    return date(year, month, day)


# Festività fisse (mese, giorno)
FIXED_HOLIDAYS = [
    (1, 1, 'Capodanno'),
    (1, 6, 'Epifania'),
    (2, 5, 'Festa di Sant\'Agata (San Marino)'),
    (3, 25, 'Anniversario dell\'Arengo (San Marino)'),
    (4, 1, 'Investitura dei Capitani Reggenti (San Marino)'),
    (4, 25, 'Festa della Liberazione'),
    (5, 1, 'Festa dei Lavoratori'),
    (6, 2, 'Festa della Repubblica Italiana'),
    (7, 28, 'Caduta del Fascismo (San Marino)'),
    (8, 15, 'Assunzione / Ferragosto'),
    (9, 3, 'Fondazione della Repubblica di San Marino'),
    (10, 1, 'Investitura dei Capitani Reggenti (San Marino)'),
    (11, 1, 'Ognissanti'),
    (11, 2, 'Commemorazione dei Defunti (San Marino)'),
    (12, 8, 'Immacolata Concezione'),
    (12, 24, 'Vigilia di Natale'),
    (12, 25, 'Natale'),
    (12, 26, 'Santo Stefano'),
    (12, 31, 'San Silvestro'),
]


def is_holiday(check_date):
    """
    Verifica se una data è un giorno festivo
    
    Args:
        check_date (date): La data da verificare
        
    Returns:
        tuple: (bool, str) - (è festivo, nome festività)
    """
    if not isinstance(check_date, date):
        return False, None
    
    year = check_date.year
    month = check_date.month
    day = check_date.day
    
    # Domenica
    if check_date.weekday() == 6:  # 6 = Domenica
        return True, 'Domenica'
    
    # Festività fisse
    for h_month, h_day, h_name in FIXED_HOLIDAYS:
        if month == h_month and day == h_day:
            return True, h_name
    
    # Pasqua e festività mobili
    easter = get_easter_date(year)
    
    # Pasqua
    if check_date == easter:
        return True, 'Pasqua'
    
    # Lunedì dell'Angelo (Pasquetta)
    pasquetta = easter + timedelta(days=1)
    if check_date == pasquetta:
        return True, 'Lunedì dell\'Angelo (Pasquetta)'
    
    # Corpus Domini (60 giorni dopo Pasqua) - solo San Marino
    corpus_domini = easter + timedelta(days=60)
    if check_date == corpus_domini:
        return True, 'Corpus Domini (San Marino)'
    
    return False, None


def is_weekend(check_date):
    """Verifica se una data è nel weekend"""
    if not isinstance(check_date, date):
        return False
    return check_date.weekday() in [5, 6]  # 5=Sabato, 6=Domenica


def is_working_day(check_date):
    """
    Verifica se una data è un giorno lavorativo
    (non festivo e non weekend)
    """
    is_hol, _ = is_holiday(check_date)
    return not is_hol and not is_weekend(check_date)


def get_holidays_for_year(year):
    """
    Ottiene la lista di tutte le festività per un dato anno
    
    Returns:
        list: Lista di tuple (date, nome)
    """
    holidays = []
    
    # Festività fisse
    for month, day, name in FIXED_HOLIDAYS:
        holidays.append((date(year, month, day), name))
    
    # Pasqua e festività mobili
    easter = get_easter_date(year)
    holidays.append((easter, 'Pasqua'))
    
    pasquetta = easter + timedelta(days=1)
    holidays.append((pasquetta, 'Lunedì dell\'Angelo (Pasquetta)'))
    
    corpus_domini = easter + timedelta(days=60)
    holidays.append((corpus_domini, 'Corpus Domini (San Marino)'))
    
    return sorted(holidays, key=lambda x: x[0])

