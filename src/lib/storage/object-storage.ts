type UploadInput = {
  fileName: string;
  contentType: string;
  body: Buffer;
};

export async function uploadObject(input: UploadInput) {
  return {
    storageKey: `${Date.now()}-${input.fileName}`,
    contentType: input.contentType,
    byteSize: input.body.byteLength,
  };
}
