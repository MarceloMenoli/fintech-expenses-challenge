export const money = (cents: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
export const civilDate = (date: string) => date.split('-').reverse().join('/');
export function today() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function monthPeriod() {
  const now = new Date();
  const month = today().slice(0, 7);
  return {
    startDate: `${month}-01`,
    endDate: `${month}-${new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()}`,
  };
}
export function parseCents(input: string): number {
  const normalized = input.trim().replace(',', '.');
  if (!/^\d{1,8}(\.\d{1,2})?$/.test(normalized))
    throw new Error('Informe um valor positivo com até duas casas decimais.');
  const [whole, fraction = ''] = normalized.split('.');
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  if (cents <= 0 || cents > 2147483647)
    throw new Error('O valor deve estar entre R$ 0,01 e R$ 21.474.836,47.');
  return cents;
}
