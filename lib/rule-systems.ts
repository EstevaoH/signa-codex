export type RuleSystemID = 'dnd5e' | 'pathfinder2e' | 'cthulhu7e' | 'gurps4e' | 'other';

export interface ModifierResult {
    value: number;
    label: string;
    description?: string;
}

export interface RuleEngine {
    calculateModifier: (attribute: number, context?: any) => number;
    getCoreDescription: () => string;
    getDiceType: () => string;
}

export const RULE_SYSTEMS: Record<RuleSystemID, { name: string, description: string, baseDice: string }> = {
    dnd5e: {
        name: "D&D 5ª Edição",
        description: "Sistema d20 equilibrado com bônus de proficiência e vantagens.",
        baseDice: "1d20"
    },
    pathfinder2e: {
        name: "Pathfinder 2ª Edição",
        description: "Sistema d20 tático com bônus por nível e graus de proficiência.",
        baseDice: "1d20"
    },
    cthulhu7e: {
        name: "Call of Cthulhu 7ª Edição",
        description: "Sistema percentual (d100) focado em investigação e horror.",
        baseDice: "1d100"
    },
    gurps4e: {
        name: "GURPS 4ª Edição",
        description: "Sistema genérico e modular usando 3d6 para testes de perícia.",
        baseDice: "3d6"
    },
    other: {
        name: "Outro / Custom",
        description: "Sistema de regras personalizado ou não listado.",
        baseDice: "d20"
    }
};

export class Dnd5eEngine implements RuleEngine {
    calculateModifier(attribute: number): number {
        return Math.floor((attribute - 10) / 2);
    }
    getCoreDescription() {
        return "1d20 + Attr Mod + Proficiência";
    }
    getDiceType() { return "d20"; }
}

export class Pathfinder2eEngine implements RuleEngine {
    calculateModifier(attribute: number, context?: { level: number, proficiencyBonus: number }): number {
        const baseMod = Math.floor((attribute - 10) / 2);
        if (context) {
            return baseMod + context.level + context.proficiencyBonus;
        }
        return baseMod;
    }
    getCoreDescription() {
        return "1d20 + Attr Mod + Nível + Proficiência";
    }
    getDiceType() { return "d20"; }
}

export class Cthulhu7eEngine implements RuleEngine {
    calculateModifier(skillValue: number): number {
        // No CoC, o "modificador" muitas vezes é o nível de dificuldade (1/2, 1/5)
        return skillValue;
    }
    getCoreDescription() {
        return "d100 <= Valor da Perícia (Normal/Metade/Quinto)";
    }
    getDiceType() { return "d100"; }

    getDifficulties(value: number) {
        return {
            normal: value,
            hard: Math.floor(value / 2),
            extreme: Math.floor(value / 5)
        };
    }
}

export class Gurps4eEngine implements RuleEngine {
    calculateModifier(skillValue: number): number {
        return skillValue;
    }
    getCoreDescription() {
        return "3d6 <= Perícia (Modificadores diretos no valor)";
    }
    getDiceType() { return "3d6"; }
}

export function getRuleEngine(systemId: string): RuleEngine {
    switch (systemId) {
        case 'dnd5e': return new Dnd5eEngine();
        case 'pathfinder2e': return new Pathfinder2eEngine();
        case 'cthulhu':
        case 'cthulhu7e': return new Cthulhu7eEngine();
        case 'gurps4e': return new Gurps4eEngine();
        default: return new Dnd5eEngine(); // Default fallback
    }
}
