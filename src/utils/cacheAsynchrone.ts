/** Chargement abandonné par vider() : ce n'est pas une erreur à afficher. */
export class ChargementAnnule extends Error {
  constructor() { super('Chargement annulé') }
}

export interface Resolue<V> { valeur: V; chargeLe: number }
interface Entree<V> { promesse: Promise<V>; resolue?: Resolue<V> }

/** Cache de promesses : partage les chargements en vol, n'enregistre pas les erreurs et permet de vider/annuler. */
export class CacheAsynchrone<V> {
  private readonly entrees = new Map<string, Entree<V>>()
  private readonly controleurs = new Set<AbortController>()
  private readonly abonnes = new Set<() => void>()
  private resolues: ReadonlyMap<string, Resolue<V>> = new Map()

  constructor(private readonly dureeVieMs = Number.POSITIVE_INFINITY) {}

  readonly abonner = (rappel: () => void): (() => void) => {
    this.abonnes.add(rappel)
    return () => { this.abonnes.delete(rappel) }
  }
  readonly instantane = (): ReadonlyMap<string, Resolue<V>> => this.resolues

  lire(cle: string): V | undefined {
    const entree = this.entrees.get(cle)
    return entree && this.fraiche(entree) ? entree.resolue?.valeur : undefined
  }

  obtenir(cle: string, charger: (signal: AbortSignal) => Promise<V>): Promise<V> {
    const existante = this.entrees.get(cle)
    if (existante && (!existante.resolue || this.fraiche(existante))) return existante.promesse

    const controleur = new AbortController()
    this.controleurs.add(controleur)
    let entree!: Entree<V>
    const promesse = charger(controleur.signal).then(
      (valeur) => {
        this.controleurs.delete(controleur)
        if (this.entrees.get(cle) === entree) {
          entree.resolue = { valeur, chargeLe: Date.now() }
          this.publier()
        }
        return valeur
      },
      (erreur: unknown) => {
        this.controleurs.delete(controleur)
        if (this.entrees.get(cle) === entree) this.entrees.delete(cle)
        throw controleur.signal.aborted ? new ChargementAnnule() : erreur
      },
    )
    entree = { promesse }
    this.entrees.set(cle, entree)
    return promesse
  }

  vider(): void {
    this.controleurs.forEach((controleur) => controleur.abort())
    this.controleurs.clear()
    this.entrees.clear()
    this.publier()
  }

  private fraiche(entree: Entree<V>): boolean {
    return entree.resolue != null && Date.now() - entree.resolue.chargeLe <= this.dureeVieMs
  }
  private publier(): void {
    const suivantes = new Map<string, Resolue<V>>()
    this.entrees.forEach((entree, cle) => { if (entree.resolue) suivantes.set(cle, entree.resolue) })
    this.resolues = suivantes
    this.abonnes.forEach((rappel) => rappel())
  }
}
