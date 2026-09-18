import {
  pickCoverImage,
  serializeFeatureValue,
  serializeProperty,
  serializePublicProperty,
} from './properties.util';

describe('properties.util serialization', () => {
  const images = [
    { id: 'i2', url: '/second.jpg', alt: 'segunda', sortOrder: 1, isCover: false },
    { id: 'i1', url: '/cover.jpg', alt: 'capa', sortOrder: 0, isCover: true },
  ];

  const features = [
    {
      valueBoolean: true,
      valueText: null,
      valueNumber: null,
      definition: { key: 'piscina', label: 'Piscina', valueType: 'BOOLEAN' },
    },
    {
      valueBoolean: null,
      valueText: 'norte',
      valueNumber: null,
      definition: { key: 'face', label: 'Face', valueType: 'TEXT' },
    },
  ];

  it('pickCoverImage prefere isCover e cai na primeira', () => {
    expect(pickCoverImage(images)?.url).toBe('/cover.jpg');
    expect(pickCoverImage([{ id: 'a', url: '/a.jpg', isCover: false }])?.url).toBe(
      '/a.jpg',
    );
    expect(pickCoverImage([])).toBeNull();
  });

  it('serializeFeatureValue respeita o tipo da definição', () => {
    expect(serializeFeatureValue(features[0])).toEqual({
      key: 'piscina',
      label: 'Piscina',
      valueType: 'BOOLEAN',
      value: true,
    });
    expect(serializeFeatureValue(features[1])?.value).toBe('norte');
  });

  it('serializeProperty inclui capa e características com URL absoluta', () => {
    process.env.API_PUBLIC_URL = 'http://localhost:4000';
    const result = serializeProperty({
      price: { toNumber: () => 425000 },
      areaM2: { toNumber: () => 72 },
      images,
      features,
      owners: [],
    });
    expect(result.coverImage).toEqual({
      id: 'i1',
      url: 'http://localhost:4000/cover.jpg',
      alt: 'capa',
    });
    expect(result.images?.[0]?.url).toBe('http://localhost:4000/second.jpg');
    expect(result.features).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: 'piscina', value: true }),
        expect.objectContaining({ key: 'face', value: 'norte' }),
      ]),
    );
  });

  it('serializeProperty absolutiza path de arquivo local e preserva CDN', () => {
    process.env.API_PUBLIC_URL = 'https://api.prod.example';
    const result = serializeProperty({
      price: 1,
      images: [
        {
          id: 'local',
          url: '/api/v1/files/properties/p1/a.jpg',
          isCover: true,
        },
        {
          id: 'cdn',
          url: 'https://cdn.example/b.jpg',
          isCover: false,
        },
      ],
    });
    expect(result.images?.[0]?.url).toBe(
      'https://api.prod.example/api/v1/files/properties/p1/a.jpg',
    );
    expect(result.images?.[1]?.url).toBe('https://cdn.example/b.jpg');
    expect(result.coverImage?.url).toBe(
      'https://api.prod.example/api/v1/files/properties/p1/a.jpg',
    );
  });

  it('público omite owners e só revela primaryOwner se publicVisible', () => {
    const row = {
      title: 'Apto',
      price: 100,
      areaM2: null,
      images: [],
      features: [],
      owners: [
        {
          isPrimary: true,
          publicVisible: false,
          person: {
            name: 'Maria',
            kind: 'INDIVIDUAL',
            document: '000',
            email: 'm@x.com',
            phone: '65999',
          },
        },
      ],
    };

    const hidden = serializePublicProperty(row);
    expect(hidden.primaryOwner).toBeNull();
    expect(hidden).not.toHaveProperty('owners');
    expect(JSON.stringify(hidden)).not.toContain('000');
    expect(JSON.stringify(hidden)).not.toContain('m@x.com');

    const visible = serializePublicProperty({
      ...row,
      owners: [{ ...row.owners[0], publicVisible: true }],
    });
    expect(visible.primaryOwner).toEqual({ name: 'Maria', kind: 'INDIVIDUAL' });
    expect(JSON.stringify(visible)).not.toContain('000');
  });

  it('público não revela proprietário não principal mesmo se visível', () => {
    const result = serializePublicProperty({
      price: 1,
      images: [],
      owners: [
        {
          isPrimary: false,
          publicVisible: true,
          person: { name: 'Sócio', kind: 'COMPANY', document: 'secret' },
        },
      ],
    });
    expect(result.primaryOwner).toBeNull();
    expect(JSON.stringify(result)).not.toContain('secret');
  });
});
