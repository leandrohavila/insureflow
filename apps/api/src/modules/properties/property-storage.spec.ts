import {
  apiPublicBaseUrl,
  filenameFromLocalUrl,
  isLocalPropertyUrl,
  propertyImagePath,
  publicImageUrl,
  resolveLocalPropertyFile,
  safeFilename,
  toAbsolutePropertyMediaUrl,
} from './property-storage';

describe('property-storage', () => {
  const prevPublic = process.env.API_PUBLIC_URL;
  const prevBase = process.env.API_BASE_URL;
  const prevApi = process.env.API_URL;
  const prevPort = process.env.PORT;

  afterEach(() => {
    process.env.API_PUBLIC_URL = prevPublic;
    process.env.API_BASE_URL = prevBase;
    process.env.API_URL = prevApi;
    process.env.PORT = prevPort;
  });

  it('rejeita filename com path traversal', () => {
    expect(safeFilename('../secret.jpg')).toBeNull();
    expect(safeFilename('a/b.jpg')).toBeNull();
    expect(safeFilename('ok-file.webp')).toBe('ok-file.webp');
  });

  it('resolveLocalPropertyFile não sai do diretório do imóvel', () => {
    expect(resolveLocalPropertyFile('p1', '..%2fetc%2fpasswd')).toBeNull();
    expect(resolveLocalPropertyFile('p1', '../other.jpg')).toBeNull();
  });

  it('publicImageUrl é absoluta com API_PUBLIC_URL', () => {
    process.env.API_PUBLIC_URL = 'https://api.example.com/';
    delete process.env.API_BASE_URL;
    delete process.env.API_URL;
    expect(apiPublicBaseUrl()).toBe('https://api.example.com');
    expect(publicImageUrl('p1', 'a.jpg')).toBe(
      'https://api.example.com/api/v1/files/properties/p1/a.jpg',
    );
    expect(propertyImagePath('p1', 'a.jpg')).toBe(
      '/api/v1/files/properties/p1/a.jpg',
    );
  });

  it('toAbsolutePropertyMediaUrl preserva http e absolutiza relativo', () => {
    process.env.API_PUBLIC_URL = 'http://localhost:4000';
    expect(
      toAbsolutePropertyMediaUrl('/api/v1/files/properties/p1/a.jpg'),
    ).toBe('http://localhost:4000/api/v1/files/properties/p1/a.jpg');
    expect(toAbsolutePropertyMediaUrl('https://cdn.example/x.jpg')).toBe(
      'https://cdn.example/x.jpg',
    );
  });

  it('isLocalPropertyUrl / filenameFromLocalUrl aceitam relativo e absoluto', () => {
    process.env.API_PUBLIC_URL = 'http://localhost:4000';
    const relative = '/api/v1/files/properties/p1/foto.jpg';
    const absolute = `http://localhost:4000${relative}`;
    expect(isLocalPropertyUrl(relative, 'p1')).toBe(true);
    expect(isLocalPropertyUrl(absolute, 'p1')).toBe(true);
    expect(isLocalPropertyUrl('https://cdn.example/x.jpg', 'p1')).toBe(false);
    expect(filenameFromLocalUrl(relative, 'p1')).toBe('foto.jpg');
    expect(filenameFromLocalUrl(absolute, 'p1')).toBe('foto.jpg');
  });
});
