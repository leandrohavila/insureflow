import { resolveLocalPropertyFile, safeFilename } from './property-storage';

describe('property-storage', () => {
  it('rejeita filename com path traversal', () => {
    expect(safeFilename('../secret.jpg')).toBeNull();
    expect(safeFilename('a/b.jpg')).toBeNull();
    expect(safeFilename('ok-file.webp')).toBe('ok-file.webp');
  });

  it('resolveLocalPropertyFile não sai do diretório do imóvel', () => {
    expect(resolveLocalPropertyFile('p1', '..%2fetc%2fpasswd')).toBeNull();
    expect(resolveLocalPropertyFile('p1', '../other.jpg')).toBeNull();
  });
});
