
export const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export const extractBase64Data = (dataUrl) => {
  if (typeof dataUrl !== 'string') return '';
  const parts = dataUrl.split(',');
  return parts.length > 1 ? parts[1] : dataUrl;
};

