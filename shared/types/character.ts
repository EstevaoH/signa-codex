export interface CharacterStats {
    name: string;
    system: string;
    image_url?: string;
    created_at: string;
    race: string;
    class: string;
    level: number;
    alignment: string;
    description: string;
    personality: string;
    notes: string;
    attributes: {
        strength: number;
        dexterity: number;
        constitution: number;
        intelligence: number;
        wisdom: number;
        charisma: number;
    };
}

export interface Character {
    id: string;
    user_id: string;
    name: string;
    system: string;
    data: CharacterStats;
    image_url?: string;
    created_at: string;
}
