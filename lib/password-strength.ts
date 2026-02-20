export interface PasswordStrength {
    score: number // 0-4
    feedback: string[]
    isValid: boolean
}

export function validatePasswordStrength(password: string): PasswordStrength {
    const feedback: string[] = []
    let score = 0

    // Length check
    if (password.length >= 8) {
        score++
    } else {
        feedback.push("Mínimo de 8 caracteres")
    }

    // Uppercase check
    if (/[A-Z]/.test(password)) {
        score++
    } else {
        feedback.push("Adicione pelo menos uma letra maiúscula")
    }

    // Lowercase check
    if (/[a-z]/.test(password)) {
        score++
    } else {
        feedback.push("Adicione pelo menos uma letra minúscula")
    }

    // Number check
    if (/[0-9]/.test(password)) {
        score++
    } else {
        feedback.push("Adicione pelo menos um número")
    }

    // Special character check
    if (/[^A-Za-z0-9]/.test(password)) {
        score++
    } else {
        feedback.push("Adicione pelo menos um caractere especial (!@#$%^&*)")
    }

    // Bonus for length
    if (password.length >= 12) {
        score = Math.min(score + 1, 5)
    }

    const isValid = score >= 4

    return {
        score: Math.min(score, 4),
        feedback,
        isValid,
    }
}

export function getPasswordStrengthLabel(score: number): string {
    switch (score) {
        case 0:
        case 1:
            return "Muito fraca"
        case 2:
            return "Fraca"
        case 3:
            return "Média"
        case 4:
            return "Forte"
        default:
            return "Muito fraca"
    }
}

export function getPasswordStrengthColor(score: number): string {
    switch (score) {
        case 0:
        case 1:
            return "bg-red-500"
        case 2:
            return "bg-orange-500"
        case 3:
            return "bg-yellow-500"
        case 4:
            return "bg-green-500"
        default:
            return "bg-gray-500"
    }
}
