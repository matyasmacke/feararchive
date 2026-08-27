const THUMBNAIL_WIDTH = 1200;
const THUMBNAIL_HEIGHT = 675;

export async function prepareStoryThumbnail(file: File): Promise<Blob> {
  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error('The selected image could not be read.'));
      element.src = objectUrl;
    });

    const sourceAspect = image.naturalWidth / image.naturalHeight;
    const targetAspect = THUMBNAIL_WIDTH / THUMBNAIL_HEIGHT;
    let sourceX = 0;
    let sourceY = 0;
    let sourceWidth = image.naturalWidth;
    let sourceHeight = image.naturalHeight;

    if (sourceAspect > targetAspect) {
      sourceWidth = image.naturalHeight * targetAspect;
      sourceX = (image.naturalWidth - sourceWidth) / 2;
    } else if (sourceAspect < targetAspect) {
      sourceHeight = image.naturalWidth / targetAspect;
      sourceY = (image.naturalHeight - sourceHeight) / 2;
    }

    const canvas = document.createElement('canvas');
    canvas.width = THUMBNAIL_WIDTH;
    canvas.height = THUMBNAIL_HEIGHT;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Image processing is not available in this browser.');

    context.drawImage(
      image,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      THUMBNAIL_WIDTH,
      THUMBNAIL_HEIGHT,
    );

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        blob => blob ? resolve(blob) : reject(new Error('The thumbnail could not be created.')),
        'image/jpeg',
        0.84,
      );
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
