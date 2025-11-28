import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { createWorker } from 'tesseract.js';

/**
 * Servicio de innovación para QR y OCR
 */
@Injectable({
  providedIn: 'root'
})
export class InnovationService {

  /**
   * Extraer texto de imagen usando Tesseract.js (OCR)
   */
  extractTextFromImage(imageFile: File): Observable<string> {
    return from(this.performOcr(imageFile));
  }

  /**
   * Realizar OCR en imagen
   */
  private async performOcr(imageFile: File): Promise<string> {
    const worker = await createWorker('spa'); // Español
    
    try {
      const { data } = await worker.recognize(imageFile);
      await worker.terminate();
      return data.text;
    } catch (error) {
      await worker.terminate();
      throw new Error('Error al procesar la imagen');
    }
  }

  /**
   * Parsear información de DNI argentino desde texto OCR
   * 
   * Estructura del DNI Argentino nuevo:
   * - Apellido / Surname: APELLIDO
   * - Nombre / Name: NOMBRE
   * - Sexo / Sex: M o F
   * - Nacionalidad / Nationality: ARGENTINA
   * - Fecha de Nacimiento / Date of Birth: DD MMM/MMM YYYY (ej: 11 JUL/JUL 1999)
   * - Fecha de Emisión / Date of Issue: DD MMM/MMM YYYY
   * - Documento / Document: 99.999.999 (8 dígitos)
   * - Trámite N° / Of. ident.: 00000000000 (11-13 dígitos)
   */
  parseDniInfo(ocrText: string): Partial<{
    dni: string;
    firstName: string;
    lastName: string;
    birthDate?: string;
    sex?: string;
  }> {
    const result: any = {};
    
    console.log('📄 Texto OCR original:', ocrText);

    // Normalizar texto manteniendo formato original para mejor detección
    const lines = ocrText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    console.log('📋 Líneas detectadas:', lines);
    console.log('📊 Total de líneas:', lines.length);
    
    // Log de líneas numeradas para debug
    lines.forEach((line, index) => {
      console.log(`  ${index}: "${line}"`);
    });

    // 1. BUSCAR APELLIDO
    // El OCR puede leer mal: "Apeliido", "Ape liido", "d Apeliido", etc.
    // Buscar línea que contenga variaciones de "Apellido" o "Surname"
    const apellidoIndex = lines.findIndex(line => 
      /ap[eoli]{2,5}[il]{1,3}[doli]{2,3}|surname/i.test(line)
    );
    
    console.log('🔍 Índice de línea Apellido:', apellidoIndex);
    
    if (apellidoIndex !== -1 && apellidoIndex + 1 < lines.length) {
      let nextLine = lines[apellidoIndex + 1];
      console.log('🔍 Línea siguiente a Apellido:', nextLine);
      
      // Limpiar caracteres extraños al inicio (como punto, coma, guiones)
      nextLine = nextLine.replace(/^[\.\,\-\s]+/, '').trim();
      
      // Validar que sea texto válido (solo letras, espacios, tildes)
      if (/^[A-ZÑÁÉÍÓÚÜ\s]+$/i.test(nextLine) && 
          nextLine.length > 1 && 
          !/(nombre|name|sexo|sex|nacionalidad|nationality|fecha|date|documento|document)/i.test(nextLine)) {
        result.lastName = nextLine.toUpperCase().trim();
        console.log('✅ Apellido encontrado (por índice con OCR tolerante):', result.lastName);
      }
    }

    // Patrón alternativo: buscar directamente después de etiqueta con errores de OCR
    if (!result.lastName) {
      const apellidoPatterns = [
        // Buscar después de la etiqueta, capturando la siguiente línea completa
        /(?:d\s)?(?:Ap[eoli]{2,5}[il]{1,3}[doli]{2,3}|Surname)\s*[\/]?\s*[A-Z]*\s*[\r\n]+\s*[\.\s]*([A-ZÑÁÉÍÓÚÜ][A-ZÑÁÉÍÓÚÜ\s]+?)(?:[\r\n]|\s{2,})/i,
        /(?:Ap[eoli]{2,5}[il]{1,3}[doli]{2,3}|Surname)\s*[\/]?\s*[A-Z]*\s*[\r\n]+\s*[\.\s]*([A-ZÑÁÉÍÓÚÜ\s]+)/i,
        // Patrones originales
        /(?:Apellido|Surname)\s*[\/]?\s*[A-Z]*\s*[\r\n]+\s*[\.\s]*([A-ZÑÁÉÍÓÚÜ\s]+?)[\r\n]/i,
        /(?:Apellido|Surname)\s*[\/]?\s*[A-Z]*\s*[\r\n]+\s*[\.\s]*([A-ZÑÁÉÍÓÚÜ\s]+)/i
      ];

      for (const pattern of apellidoPatterns) {
        const match = ocrText.match(pattern);
        if (match && match[1]) {
          let apellido = match[1].trim();
          // Limpiar puntos y caracteres al inicio
          apellido = apellido.replace(/^[\.\,\-\s]+/, '').trim();
          
          // Verificar que no sea otra etiqueta
          if (apellido.length > 1 && !/(nombre|name|sexo|sex|nacionalidad|nationality|fecha|date)/i.test(apellido)) {
            result.lastName = apellido.toUpperCase();
            console.log('✅ Apellido encontrado (por regex tolerante a OCR):', result.lastName);
            break;
          }
        }
      }
    }

    // Estrategia adicional: buscar la primera línea de solo letras mayúsculas después del header
    if (!result.lastName) {
      // Buscar líneas que sean solo texto en mayúsculas (posibles nombres/apellidos)
      const candidateLines = [];
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const cleanLine = line.replace(/^[\.\,\-\s\[]+/, '').replace(/[\.\,\-\s\]]+$/, '').trim();
        
        // Si la línea es solo letras mayúsculas y no es una etiqueta
        if (/^[A-ZÑÁÉÍÓÚÜ\s]{2,40}$/.test(cleanLine) &&
            !/(republica|argentina|mercosur|registro|nacional|ministerio|interior|documento|identidad|ap[eoli]+|apellido|surname|nombre|name|sexo|sex|fecha|date|nacionalidad|nationality)/i.test(cleanLine)) {
          candidateLines.push({ index: i, text: cleanLine });
          console.log(`🔍 Línea candidata ${i}: "${cleanLine}"`);
        }
      }
      
      // El apellido suele ser la primera línea candidata
      if (candidateLines.length > 0) {
        result.lastName = candidateLines[0].text.toUpperCase().trim();
        console.log('✅ Apellido encontrado (estrategia de candidatos):', result.lastName);
      }
    }

    // 2. BUSCAR NOMBRE
    // Buscar línea después de "Nombre" o "Name"
    const nombreIndex = lines.findIndex(line => 
      /^nombre\s*[\/]?\s*name$/i.test(line.trim())
    );
    
    console.log('🔍 Índice de línea Nombre:', nombreIndex);
    
    if (nombreIndex !== -1 && nombreIndex + 1 < lines.length) {
      let nextLine = lines[nombreIndex + 1];
      console.log('🔍 Línea siguiente a Nombre:', nextLine);
      
      // Limpiar "y " al inicio (OCR común en DNI) y otros caracteres
      nextLine = nextLine.replace(/^[y\.\,\-\s]+/i, '').trim();
      
      if (/^[A-ZÑÁÉÍÓÚÜ\s]+$/i.test(nextLine) && nextLine.length > 1) {
        result.firstName = nextLine.toUpperCase().trim();
        console.log('✅ Nombre encontrado (por índice):', result.firstName);
      }
    }

    // Patrón alternativo
    if (!result.firstName) {
      const nombrePatterns = [
        // Buscar después de "Nombre / Name", limpiando "y " al inicio
        /(?:Nombre|Name)\s*[\/]?\s*[A-Z]*\s*[\r\n]+\s*[y\s]*([A-ZÑÁÉÍÓÚÜ\s]+?)(?:[\r\n]|\s{2,})/i,
        /(?:Nombre|Name)\s*[\/]?\s*[A-Z]*\s*[\r\n]+\s*[y\s]*([A-ZÑÁÉÍÓÚÜ\s]+)/i
      ];
      
      for (const pattern of nombrePatterns) {
        const match = ocrText.match(pattern);
        if (match && match[1]) {
          let nombre = match[1].trim();
          // Limpiar "y " al inicio
          nombre = nombre.replace(/^[y\s]+/i, '').trim();
          
          if (nombre.length > 1) {
            result.firstName = nombre.toUpperCase();
            console.log('✅ Nombre encontrado (por regex):', result.firstName);
            break;
          }
        }
      }
    }

    // 3. BUSCAR DNI/DOCUMENTO
    // El documento está en la parte inferior, es un número de 8 dígitos
    // Puede estar con puntos: 81.544.670 o sin: 81544670
    const documentoPatterns = [
      /(?:Documento|Document)\s*[\/]?\s*[A-Z]*\s*\n\s*(\d{1,2}[\.\s]?\d{3}[\.\s]?\d{3})/i,
      /\b(\d{2}[\.\s]\d{3}[\.\s]\d{3})\b/, // Formato con puntos: 81.544.670
      /\b(\d{8})\b/ // 8 dígitos consecutivos
    ];

    for (const pattern of documentoPatterns) {
      const match = ocrText.match(pattern);
      if (match && match[1]) {
        // Limpiar puntos y espacios
        const dniClean = match[1].replace(/[\.\s]/g, '');
        // Validar que sean exactamente 8 dígitos
        if (dniClean.length === 8 && /^\d+$/.test(dniClean)) {
          result.dni = dniClean;
          console.log('✅ DNI encontrado:', result.dni);
          break;
        }
      }
    }

    // 4. BUSCAR FECHA DE NACIMIENTO
    // Formato típico: "11 JUL/JUL 1999" o "01 NOV/ NOV 1969"
    const birthDatePatterns = [
      /(?:Fecha\s+de\s+[Nn]acimiento|Date\s+of\s+[Bb]irth)\s*[\/]?\s*[A-Z]*\s*\n\s*(\d{1,2}\s+[A-Z]{3}[\/\s]*[A-Z]{3}\s+\d{4})/i,
      /\b(\d{1,2}\s+(?:ENE|FEB|MAR|ABR|MAY|JUN|JUL|AGO|SEP|OCT|NOV|DIC)[\/\s]*(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s+\d{4})\b/i,
      /(?:nacimiento|birth)[^\n]*\n\s*(\d{1,2}\s+[A-Z]{3}[\/\s]*[A-Z]{3}\s+\d{4})/i
    ];

    for (const pattern of birthDatePatterns) {
      const match = ocrText.match(pattern);
      if (match && match[1]) {
        result.birthDate = match[1].trim();
        console.log('✅ Fecha de nacimiento encontrada:', result.birthDate);
        break;
      }
    }

    // Patrón alternativo: cualquier fecha con mes en letras
    if (!result.birthDate) {
      const dateMatch = ocrText.match(/\b(\d{1,2}\s+[A-Z]{3}[\/\s]*[A-Z]{3}\s+\d{4})\b/i);
      if (dateMatch) {
        result.birthDate = dateMatch[1].trim();
        console.log('✅ Fecha encontrada (alternativa):', result.birthDate);
      }
    }

    // 5. BUSCAR SEXO
    // Buscar "Sexo / Sex" seguido de M o F
    const sexPatterns = [
      /(?:Sexo|Sex)\s*[\/]?\s*[A-Z]*\s*\n?\s*([MF])\b/i,
      /\b(?:Sexo|Sex)[:\s]*([MF])\b/i
    ];

    for (const pattern of sexPatterns) {
      const match = ocrText.match(pattern);
      if (match && match[1]) {
        result.sex = match[1].toUpperCase();
        console.log('✅ Sexo encontrado:', result.sex);
        break;
      }
    }

    // Validaciones finales
    if (!result.dni) {
      console.warn('⚠️ No se encontró DNI en el texto');
    }
    if (!result.firstName || !result.lastName) {
      console.warn('⚠️ No se encontró nombre completo');
    }
    if (!result.birthDate) {
      console.warn('⚠️ No se encontró fecha de nacimiento');
    }

    console.log('📊 Resultado final del parseo:', result);
    return result;
  }
}
