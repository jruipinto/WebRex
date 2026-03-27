export class CompressionHelpers {
  static async compressToBase64(data: string): Promise<string> {
    const stream = new Blob([data])
      .stream()
      .pipeThrough(new CompressionStream('gzip'));
    const buffer = await new Response(stream).arrayBuffer();
    // Use a modern approach to avoid atob/btoa character issues
    return btoa(String.fromCharCode(...new Uint8Array(buffer)));
  }

  static async decompressFromBase64(base64: string): Promise<string> {
    // Use Uint8Array.from to safely recreate binary data
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const stream = new Blob([bytes])
      .stream()
      .pipeThrough(new DecompressionStream('gzip'));
    return new Response(stream).text();
  }
}
