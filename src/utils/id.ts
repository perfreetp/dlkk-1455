export const uid = (prefix: string = ''): string => {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).substring(2, 8)}`;
};

export const uuid = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};
