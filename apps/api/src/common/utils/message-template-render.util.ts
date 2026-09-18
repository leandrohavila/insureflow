export type MessageTemplateVariables = {
  nome?: string | null;
  interesse?: string | null;
  empresa?: string | null;
  corretor?: string | null;
  produto?: string | null;
  vencimento?: string | null;
};

const TEMPLATE_TOKEN =
  /\{\{\s*(nome|interesse|empresa|corretor|produto|vencimento)\s*\}\}/gi;

export function renderMessageTemplate(
  content: string,
  variables: MessageTemplateVariables,
): string {
  const values: Record<string, string> = {
    nome: variables.nome?.trim() || 'cliente',
    interesse: variables.interesse?.trim() || 'sua oportunidade',
    empresa: variables.empresa?.trim() || 'nossa equipe',
    corretor: variables.corretor?.trim() || 'seu consultor',
    produto: variables.produto?.trim() || 'seu seguro',
    vencimento: variables.vencimento?.trim() || 'breve',
  };

  return content.replace(TEMPLATE_TOKEN, (_match, key: string) => {
    return values[key.toLowerCase()] ?? '';
  });
}
