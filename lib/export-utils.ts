import Papa from 'papaparse'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

/**
 * CSV 내보내기
 */
export function exportToCSV(data: any[], filename: string = 'data.csv') {
  try {
    const csv = Papa.unparse(data)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    return { success: true, message: `CSV 파일이 다운로드되었습니다: ${filename}` }
  } catch (error) {
    console.error('CSV 내보내기 오류:', error)
    return { success: false, message: 'CSV 내보내기에 실패했습니다.' }
  }
}

/**
 * PNG 캡처 (단일 요소)
 */
export async function captureElementToPNG(
  elementId: string,
  filename: string = 'screenshot.png',
  options: {
    scale?: number
    backgroundColor?: string
  } = {}
): Promise<{ success: boolean; message: string }> {
  try {
    const element = document.getElementById(elementId)
    if (!element) {
      return { success: false, message: `요소를 찾을 수 없습니다: ${elementId}` }
    }

    const canvas = await html2canvas(element, {
      scale: options.scale || 2,
      backgroundColor: options.backgroundColor || '#ffffff',
      logging: false,
      useCORS: true,
    })

    const link = document.createElement('a')
    link.download = filename
    link.href = canvas.toDataURL('image/png')
    link.click()

    return { success: true, message: `이미지가 저장되었습니다: ${filename}` }
  } catch (error) {
    console.error('PNG 캡처 오류:', error)
    return { success: false, message: 'PNG 캡처에 실패했습니다.' }
  }
}

/**
 * PDF 보고서 생성
 */
export async function generatePDFReport(
  options: {
    title: string
    subtitle?: string
    sections: {
      title: string
      elementId?: string
      text?: string
    }[]
    filename?: string
    includeMetadata?: {
      dateRange?: string
      filters?: string[]
      generatedAt?: string
    }
  }
): Promise<{ success: boolean; message: string }> {
  try {
    const pdf = new jsPDF('p', 'mm', 'a4')
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 20
    let yPosition = margin

    // 제목 추가
    pdf.setFontSize(20)
    pdf.setFont('helvetica', 'bold')
    pdf.text(options.title, margin, yPosition)
    yPosition += 10

    // 부제목 추가
    if (options.subtitle) {
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'normal')
      pdf.text(options.subtitle, margin, yPosition)
      yPosition += 10
    }

    // 메타데이터 추가
    if (options.includeMetadata) {
      pdf.setFontSize(10)
      pdf.setTextColor(100, 100, 100)
      
      if (options.includeMetadata.dateRange) {
        yPosition += 5
        pdf.text(`기간: ${options.includeMetadata.dateRange}`, margin, yPosition)
      }
      
      if (options.includeMetadata.filters && options.includeMetadata.filters.length > 0) {
        yPosition += 5
        pdf.text(`필터: ${options.includeMetadata.filters.join(', ')}`, margin, yPosition)
      }
      
      if (options.includeMetadata.generatedAt) {
        yPosition += 5
        pdf.text(`생성일시: ${options.includeMetadata.generatedAt}`, margin, yPosition)
      }
      
      yPosition += 10
      pdf.setTextColor(0, 0, 0)
    }

    // 구분선
    pdf.setDrawColor(200, 200, 200)
    pdf.line(margin, yPosition, pageWidth - margin, yPosition)
    yPosition += 10

    // 섹션 추가
    for (let i = 0; i < options.sections.length; i++) {
      const section = options.sections[i]

      // 섹션 제목
      pdf.setFontSize(14)
      pdf.setFont('helvetica', 'bold')
      pdf.text(section.title, margin, yPosition)
      yPosition += 8

      // 텍스트 콘텐츠
      if (section.text) {
        pdf.setFontSize(10)
        pdf.setFont('helvetica', 'normal')
        const textLines = pdf.splitTextToSize(section.text, pageWidth - 2 * margin)
        pdf.text(textLines, margin, yPosition)
        yPosition += textLines.length * 5 + 5
      }

      // 요소 캡처
      if (section.elementId) {
        const element = document.getElementById(section.elementId)
        if (element) {
          try {
            const canvas = await html2canvas(element, {
              scale: 1,
              backgroundColor: '#ffffff',
              logging: false,
              useCORS: true,
            })

            const imgData = canvas.toDataURL('image/png')
            const imgWidth = pageWidth - 2 * margin
            const imgHeight = (canvas.height * imgWidth) / canvas.width

            // 페이지 넘김 체크
            if (yPosition + imgHeight > pageHeight - margin) {
              pdf.addPage()
              yPosition = margin
            }

            pdf.addImage(imgData, 'PNG', margin, yPosition, imgWidth, imgHeight)
            yPosition += imgHeight + 10
          } catch (error) {
            console.error(`섹션 "${section.title}" 캡처 실패:`, error)
            pdf.setFontSize(10)
            pdf.setTextColor(255, 0, 0)
            pdf.text(`[이미지 캡처 실패]`, margin, yPosition)
            yPosition += 10
            pdf.setTextColor(0, 0, 0)
          }
        }
      }

      // 페이지 넘김 체크 (다음 섹션 시작 전)
      if (yPosition > pageHeight - 60 && i < options.sections.length - 1) {
        pdf.addPage()
        yPosition = margin
      }
    }

    // 페이지 번호 추가
    const pageCount = pdf.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i)
      pdf.setFontSize(10)
      pdf.setTextColor(150, 150, 150)
      pdf.text(
        `${i} / ${pageCount}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      )
    }

    // PDF 저장
    const filename = options.filename || 'report.pdf'
    pdf.save(filename)

    return { success: true, message: `PDF 보고서가 생성되었습니다: ${filename}` }
  } catch (error) {
    console.error('PDF 생성 오류:', error)
    return { success: false, message: 'PDF 생성에 실패했습니다.' }
  }
}

/**
 * 여러 차트를 하나의 PDF로 내보내기
 */
export async function exportMultipleChartsToPDF(
  chartIds: string[],
  filename: string = 'charts.pdf'
): Promise<{ success: boolean; message: string }> {
  try {
    const pdf = new jsPDF('p', 'mm', 'a4')
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 10

    for (let i = 0; i < chartIds.length; i++) {
      const element = document.getElementById(chartIds[i])
      if (!element) continue

      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
      })

      const imgData = canvas.toDataURL('image/png')
      const imgWidth = pageWidth - 2 * margin
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      if (i > 0) {
        pdf.addPage()
      }

      const yPosition = (pageHeight - imgHeight) / 2
      pdf.addImage(imgData, 'PNG', margin, yPosition, imgWidth, imgHeight)
    }

    pdf.save(filename)
    return { success: true, message: `차트 PDF가 생성되었습니다: ${filename}` }
  } catch (error) {
    console.error('PDF 생성 오류:', error)
    return { success: false, message: 'PDF 생성에 실패했습니다.' }
  }
}

