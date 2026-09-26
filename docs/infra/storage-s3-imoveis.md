# Storage S3 das imagens imobiliárias

Fotos de imóveis e arquivos do portal (logo, hero, sobre e banner) usam `StorageProvider`. Com `STORAGE_DRIVER=s3` o arquivo vai para o bucket. O disco do container deixa de ser a origem dessas imagens novas.

`STORAGE_DRIVER` ausente ou `local` mantém `uploads/` e a rota `/api/v1/files/...`.

## Variáveis

| Variável | Obrigatória em `s3` | Função |
| --- | --- | --- |
| `STORAGE_DRIVER` | sim | `local` ou `s3`. `STORAGE_PROVIDER` vale como fallback |
| `STORAGE_BUCKET` | sim | Nome do bucket |
| `STORAGE_REGION` | sim | Região, por exemplo `sa-east-1` |
| `STORAGE_PUBLIC_URL` | sim | Base pública, sem barra final |
| `STORAGE_ACCESS_KEY` | não | Se vazia, o SDK usa a cadeia padrão de credenciais |
| `STORAGE_SECRET_KEY` | com a access key | Secret da access key |
| `STORAGE_ENDPOINT` | não | Endpoint alternativo |
| `STORAGE_FORCE_PATH_STYLE` | não | `true` para endpoint com path |

Exemplo:

```env
STORAGE_DRIVER=s3
STORAGE_BUCKET=avila-imoveis-prod
STORAGE_REGION=sa-east-1
STORAGE_PUBLIC_URL=https://avila-imoveis-prod.s3.sa-east-1.amazonaws.com
STORAGE_ACCESS_KEY=AKIA...
STORAGE_SECRET_KEY=...
```

Keys gravadas:

- imóvel: `properties/{propertyId}/{arquivo}`
- portal: `portal/{businessUnitId}/{arquivo}`

A resposta HTTP devolve a URL pública. No banco do imóvel, `property_images.url` e `storage_key` guardam a key, e `storage_driver` fica `s3`. Logo, hero, sobre e banner guardam a URL pública no campo que já existia.

Imagem antiga, com `storage_driver` nulo, continua em `/api/v1/files/...`. URL `https://` de outro host não é apagada no nosso bucket.

## IAM mínima

A chave só precisa escrever e apagar os dois prefixos. `HeadObject` usa `s3:GetObject`.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PropertyAndPortalObjects",
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:DeleteObject", "s3:GetObject"],
      "Resource": [
        "arn:aws:s3:::avila-imoveis-prod/properties/*",
        "arn:aws:s3:::avila-imoveis-prod/portal/*"
      ]
    }
  ]
}
```

## Leitura pública mínima

O `PutObject` não marca o objeto como público. O bucket precisa desta política, e o bloqueio de políticas públicas não pode recusar este statement. CloudFront na frente do bucket também serve, desde que `STORAGE_PUBLIC_URL` aponte para ele.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadPropertyAndPortal",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": [
        "arn:aws:s3:::avila-imoveis-prod/properties/*",
        "arn:aws:s3:::avila-imoveis-prod/portal/*"
      ]
    }
  ]
}
```

## Ordem para ativar

1. Criar o bucket e aplicar a política pública e a IAM.
2. Publicar a API. O boot roda `prisma migrate deploy` e aplica `20260926010000_property_image_storage` (`storage_key` e `storage_driver`, ambos nulos).
3. Confirmar o log `[start-release] Running prisma migrate deploy` sem erro.
4. Definir as variáveis no Railway e fazer um novo deploy para o processo enxergar o ambiente.
5. Só então o driver passa a valer. Até esse deploy, o comportamento segue local.

## Validação depois do deploy

1. No CRM, enviar uma foto de imóvel. A `url` da resposta começa com `STORAGE_PUBLIC_URL`. `GET` nessa URL retorna 200 e a imagem.
2. A listagem e o detalhe no CRM e no portal mostram essa foto.
3. Apagar a foto. O `GET` da URL deixa de retornar o arquivo e a linha some do imóvel.
4. Enviar duas fotos e simular falha não é obrigatório em produção. A suíte cobre o rollback.
5. Enviar logo ou banner. A URL também começa com `STORAGE_PUBLIC_URL`. Reiniciar o serviço Railway não remove a imagem.
6. Abrir um imóvel que já tinha foto antes do S3. A URL antiga `/api/v1/files/properties/...` continua válida enquanto o arquivo ainda existir no disco. Esta versão não copia o arquivo antigo para o bucket.

## Rollback

- Antes de qualquer upload com `s3`: voltar a imagem da API ou remover `STORAGE_DRIVER`. As colunas novas podem ficar.
- Depois de uploads `s3`: o código anterior trata a key gravada em `url` como path da API e a foto nova quebra. Os objetos continuam no bucket. Para desfazer, volte o código novo ou aponte de novo `STORAGE_DRIVER=s3`. Não apague as colunas.
