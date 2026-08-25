# Forms

Formulários devem ser produtivos, compactos e acessíveis.

## Padrões

- Label: pequena, legível e associada ao campo.
- Input operacional: altura compacta oficial.
- Erro: `aria-invalid`, mensagem próxima e contraste adequado.
- Grupos: grid responsivo com gaps oficiais.
- Footer: ações alinhadas à direita em desktop.

## Proibido

- Criar input customizado por tela.
- Misturar alturas sem variante documentada.
- Usar selects nativos com estilos inline em novas telas.

## Componentes

- `FormLayout`: grid responsivo oficial para grupos de campos.
- `FormField`: associa label, required, erro, ajuda e hint ao controle.
- Quando recebe um único controle React válido, `FormField` propaga `aria-describedby`, `aria-invalid`, `aria-required` e `disabled` conforme o estado do campo.
- Mensagens de erro devem ser curtas, próximas ao campo e usar o estado `error`.
