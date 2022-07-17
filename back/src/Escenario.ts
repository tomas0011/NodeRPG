export class Escenario {
    private static escenario: Escenario | null = null

    private constructor () {}

    personaje: string = 'Tomas';
    lugar: string = 'Bar';

    public static getInstance(): Escenario {
        if (!Escenario.escenario) {
            Escenario.escenario = new Escenario();
        }
        return Escenario.escenario
    }

    private getPersonaje(): string {
        return this.personaje
    }

    private getLugar(): string {
        return this.lugar
    }

    public getEscenario(): string {
        return `
            Personaje: ${this.getPersonaje()}
            Lugar: ${this.getLugar()}
        `;
    }
}
