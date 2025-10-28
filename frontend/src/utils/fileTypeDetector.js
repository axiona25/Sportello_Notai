/**
 * Utility per rilevare il tipo di file e determinare quale viewer usare
 */

export const FileType = {
  PDF: 'pdf',
  IMAGE: 'image',
  VIDEO: 'video',
  AUDIO: 'audio',
  OFFICE_WORD: 'office_word',
  OFFICE_EXCEL: 'office_excel',
  OFFICE_POWERPOINT: 'office_powerpoint',
  UNKNOWN: 'unknown'
}

/**
 * Estensioni supportate per tipo
 */
const FILE_EXTENSIONS = {
  [FileType.PDF]: ['pdf'],
  [FileType.IMAGE]: ['jpg', 'jpeg', 'png', 'tiff', 'tif', 'gif', 'bmp', 'webp'],
  [FileType.VIDEO]: ['mp4', 'mov', 'avi', 'webm', 'mkv', 'flv'],
  [FileType.AUDIO]: ['mp3', 'wav', 'wave', 'ogg', 'aac', 'm4a', 'flac'],
  [FileType.OFFICE_WORD]: ['doc', 'docx', 'odt', 'rtf'],
  [FileType.OFFICE_EXCEL]: ['xls', 'xlsx', 'ods', 'csv'],
  [FileType.OFFICE_POWERPOINT]: ['ppt', 'pptx', 'odp']
}

/**
 * MIME types supportati
 */
const MIME_TYPES = {
  // PDF
  'application/pdf': FileType.PDF,
  
  // Immagini
  'image/jpeg': FileType.IMAGE,
  'image/jpg': FileType.IMAGE,
  'image/png': FileType.IMAGE,
  'image/tiff': FileType.IMAGE,
  'image/gif': FileType.IMAGE,
  'image/bmp': FileType.IMAGE,
  'image/webp': FileType.IMAGE,
  
  // Video
  'video/mp4': FileType.VIDEO,
  'video/quicktime': FileType.VIDEO,
  'video/x-msvideo': FileType.VIDEO,
  'video/webm': FileType.VIDEO,
  'video/x-matroska': FileType.VIDEO,
  
  // Audio
  'audio/mpeg': FileType.AUDIO,
  'audio/mp3': FileType.AUDIO,
  'audio/wav': FileType.AUDIO,
  'audio/wave': FileType.AUDIO,
  'audio/ogg': FileType.AUDIO,
  'audio/aac': FileType.AUDIO,
  
  // Office Word
  'application/msword': FileType.OFFICE_WORD,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': FileType.OFFICE_WORD,
  'application/vnd.oasis.opendocument.text': FileType.OFFICE_WORD,
  'application/rtf': FileType.OFFICE_WORD,
  
  // Office Excel
  'application/vnd.ms-excel': FileType.OFFICE_EXCEL,
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': FileType.OFFICE_EXCEL,
  'application/vnd.oasis.opendocument.spreadsheet': FileType.OFFICE_EXCEL,
  'text/csv': FileType.OFFICE_EXCEL,
  
  // Office PowerPoint
  'application/vnd.ms-powerpoint': FileType.OFFICE_POWERPOINT,
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': FileType.OFFICE_POWERPOINT,
  'application/vnd.oasis.opendocument.presentation': FileType.OFFICE_POWERPOINT
}

/**
 * Rileva il tipo di file dall'estensione
 */
export function detectFileTypeFromExtension(filename) {
  if (!filename) return FileType.UNKNOWN
  
  const ext = filename.split('.').pop().toLowerCase()
  
  for (const [fileType, extensions] of Object.entries(FILE_EXTENSIONS)) {
    if (extensions.includes(ext)) {
      return fileType
    }
  }
  
  return FileType.UNKNOWN
}

/**
 * Rileva il tipo di file dal MIME type
 */
export function detectFileTypeFromMime(mimeType) {
  if (!mimeType) return FileType.UNKNOWN
  
  return MIME_TYPES[mimeType] || FileType.UNKNOWN
}

/**
 * Rileva il tipo di file da un oggetto documento
 * ✅ REGOLA FISSA: Usa SEMPRE file_path reale, non filename (che può essere fuorviante)
 */
export function detectFileType(document) {
  if (!document) return FileType.UNKNOWN
  
  // Prova prima con MIME type se disponibile
  if (document.mime_type || document.mimeType) {
    const type = detectFileTypeFromMime(document.mime_type || document.mimeType)
    if (type !== FileType.UNKNOWN) return type
  }
  
  // ✅ USA SEMPRE file_path (file reale) PRIMA di filename (nome originale)
  // Questo garantisce che un PDF salvato come .pdf apra il PDF viewer,
  // anche se il nome originale era .doc
  const filePath = document.file_path || 
                   document.file || 
                   document.document_url || 
                   document.filename ||
                   document.name || 
                   ''
  
  return detectFileTypeFromExtension(filePath)
}

/**
 * Verifica se un file è di tipo Office
 */
export function isOfficeDocument(fileType) {
  return [
    FileType.OFFICE_WORD,
    FileType.OFFICE_EXCEL,
    FileType.OFFICE_POWERPOINT
  ].includes(fileType)
}

/**
 * Verifica se un file supporta l'editing
 */
export function supportsEditing(fileType) {
  return isOfficeDocument(fileType)
}

/**
 * Ottieni un'icona/descrizione leggibile per il tipo di file
 */
export function getFileTypeLabel(fileType) {
  const labels = {
    [FileType.PDF]: 'PDF',
    [FileType.IMAGE]: 'Immagine',
    [FileType.VIDEO]: 'Video',
    [FileType.AUDIO]: 'Audio',
    [FileType.OFFICE_WORD]: 'Documento Word',
    [FileType.OFFICE_EXCEL]: 'Foglio Excel',
    [FileType.OFFICE_POWERPOINT]: 'Presentazione PowerPoint',
    [FileType.UNKNOWN]: 'Documento'
  }
  
  return labels[fileType] || 'Documento'
}

/**
 * Ottieni il colore badge per tipo di file
 */
export function getFileTypeColor(fileType) {
  const colors = {
    [FileType.PDF]: '#EF4444',           // Rosso
    [FileType.IMAGE]: '#10B981',         // Verde
    [FileType.VIDEO]: '#8B5CF6',         // Viola
    [FileType.AUDIO]: '#F59E0B',         // Arancione
    [FileType.OFFICE_WORD]: '#3B82F6',   // Blu
    [FileType.OFFICE_EXCEL]: '#059669',  // Verde scuro
    [FileType.OFFICE_POWERPOINT]: '#DC2626', // Rosso scuro
    [FileType.UNKNOWN]: '#6B7280'        // Grigio
  }
  
  return colors[fileType] || '#6B7280'
}

