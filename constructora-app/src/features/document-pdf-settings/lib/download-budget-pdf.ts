'use client';

const COLOR_PROPS = [
  'color',
  'backgroundColor',
  'borderTopColor',
  'borderRightColor',
  'borderBottomColor',
  'borderLeftColor',
  'outlineColor',
  'textDecorationColor',
  'columnRuleColor',
  'caretColor',
  'fill',
  'stroke',
] as const;

let colorNormalizationContext: CanvasRenderingContext2D | null = null;

function getColorNormalizationContext() {
  if (colorNormalizationContext) {
    return colorNormalizationContext;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  colorNormalizationContext = canvas.getContext('2d');
  return colorNormalizationContext;
}

function normalizeColor(value: string) {
  const trimmed = value.trim();
  if (!trimmed || trimmed === 'transparent' || trimmed === 'none' || trimmed === 'currentcolor') {
    return trimmed;
  }

  const context = getColorNormalizationContext();
  if (!context) {
    return trimmed;
  }

  const previous = context.fillStyle;

  try {
    context.fillStyle = '#000000';
    context.fillStyle = trimmed;
    return String(context.fillStyle);
  } catch {
    return trimmed;
  } finally {
    context.fillStyle = previous;
  }
}

function sanitizeShadow(value: string) {
  if (!value || value === 'none') {
    return 'none';
  }

  return 'none';
}

function containsUnsupportedColorFunction(value: string) {
  return /(oklch|oklab|lab|lch|color-mix)\(/i.test(value);
}

function copyComputedStyles(
  originalElement: HTMLElement,
  clonedElement: HTMLElement,
  computedStyle: CSSStyleDeclaration,
) {
  for (const propertyName of Array.from(computedStyle)) {
    const propertyValue = computedStyle.getPropertyValue(propertyName);
    const propertyPriority = computedStyle.getPropertyPriority(propertyName);

    if (!propertyValue) {
      continue;
    }

    if (propertyName === 'box-shadow' || propertyName === 'text-shadow') {
      clonedElement.style.setProperty(propertyName, 'none', propertyPriority);
      continue;
    }

    if ((COLOR_PROPS as readonly string[]).includes(propertyName)) {
      const normalized = normalizeColor(propertyValue);
      if (normalized) {
        clonedElement.style.setProperty(propertyName, normalized, propertyPriority);
      }
      continue;
    }

    if (containsUnsupportedColorFunction(propertyValue)) {
      continue;
    }

    clonedElement.style.setProperty(propertyName, propertyValue, propertyPriority);
  }

  clonedElement.style.boxShadow = sanitizeShadow(computedStyle.boxShadow);
  clonedElement.style.textShadow = sanitizeShadow(computedStyle.textShadow);
  clonedElement.removeAttribute('class');
}

function sanitizeCloneForPdfCapture(element: HTMLElement) {
  const clone = element.cloneNode(true) as HTMLElement;
  clone.setAttribute('data-pdf-capture-root', 'true');
  const originalElements = [element, ...Array.from(element.querySelectorAll<HTMLElement>('*'))];
  const clonedElements = [clone, ...Array.from(clone.querySelectorAll<HTMLElement>('*'))];

  for (const [index, clonedElement] of clonedElements.entries()) {
    const originalElement = originalElements[index];
    if (!originalElement) {
      continue;
    }

    const computedStyle = window.getComputedStyle(originalElement);
    copyComputedStyles(originalElement, clonedElement, computedStyle);
  }

  clone.style.position = 'fixed';
  clone.style.left = '-100000px';
  clone.style.top = '0';
  clone.style.zIndex = '-1';
  clone.style.margin = '0';
  clone.style.transform = 'none';
  clone.style.filter = 'none';

  return clone;
}

export async function downloadElementAsPdf(element: HTMLElement, fileName: string) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ]);

  const sanitizedClone = sanitizeCloneForPdfCapture(element);
  document.body.appendChild(sanitizedClone);

  let canvas: HTMLCanvasElement;

  try {
    canvas = await html2canvas(sanitizedClone, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
      onclone: (clonedDocument) => {
        for (const stylesheetNode of Array.from(
          clonedDocument.querySelectorAll('style, link[rel="stylesheet"]'),
        )) {
          stylesheetNode.remove();
        }

        const clonedRoot = clonedDocument.querySelector<HTMLElement>('[data-pdf-capture-root="true"]');
        if (clonedRoot) {
          clonedRoot.style.position = 'static';
          clonedRoot.style.left = '0';
          clonedRoot.style.top = '0';
          clonedRoot.style.zIndex = 'auto';
        }
      },
    });
  } finally {
    sanitizedClone.remove();
  }

  const imageData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const horizontalMargin = 8;
  const verticalMargin = 8;
  const imageWidth = pageWidth - horizontalMargin * 2;
  const imageHeight = (canvas.height * imageWidth) / canvas.width;
  const printableHeight = pageHeight - verticalMargin * 2;

  let renderedHeight = imageHeight;
  let positionY = verticalMargin;

  pdf.addImage(imageData, 'PNG', horizontalMargin, positionY, imageWidth, imageHeight);
  renderedHeight -= printableHeight;

  while (renderedHeight > 0) {
    positionY = verticalMargin - (imageHeight - renderedHeight);
    pdf.addPage();
    pdf.addImage(imageData, 'PNG', horizontalMargin, positionY, imageWidth, imageHeight);
    renderedHeight -= printableHeight;
  }

  pdf.save(fileName);
}
