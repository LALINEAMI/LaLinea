export type VipCliente = { nome: string; telefono: string; punti: number };
export type VipMovimento = { id: string; punti: number; descrizione: string; created_at: string };
export type VipOrdine = { id: string; creatoIl: string; importoProdotti: number | null; costoConsegna: number | null; stato: 'received' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'unknown'; prodotti: string | null; giornoConsegna: string | null; orario: string | null };
export type VipArea = { cliente: VipCliente; movimenti: VipMovimento[]; ordini: VipOrdine[]; pagina: number; altriOrdini: boolean; tessera: { svg: string } | null; avviso: string | null; aggiornatoIl: string };
