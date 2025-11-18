# Convenções de Commits

Este documento descreve as convenções de nomenclatura de commits utilizadas no projeto.

## Formato

```
<tipo>(<escopo>): <descrição curta>

<corpo opcional>

<rodapé opcional>
```

## Tipos de Commit

### `feat`
Nova funcionalidade
```
feat(dashboard): adiciona sistema de notificações
```

### `fix`
Correção de bug
```
fix(api): corrige erro de TypeScript no endpoint de usuários
```

### `refactor`
Refatoração de código sem mudança de funcionalidade
```
refactor(dashboard): refatora dashboard principal com design moderno
```

### `style`
Mudanças de formatação, espaços, etc (não afeta funcionalidade)
```
style: corrige formatação do código
```

### `docs`
Mudanças na documentação
```
docs: atualiza README com instruções de instalação
```

### `test`
Adição ou correção de testes
```
test(api): adiciona testes para endpoint de tarefas
```

### `chore`
Tarefas de manutenção, atualização de dependências, etc
```
chore: atualiza dependências do projeto
```

### `perf`
Melhorias de performance
```
perf(dashboard): otimiza carregamento de estatísticas
```

### `ci`
Mudanças em configurações de CI/CD
```
ci: adiciona pipeline de deploy automático
```

## Escopo (Opcional)

O escopo deve ser o nome do módulo ou componente afetado:
- `dashboard`
- `api`
- `auth`
- `tarefas`
- `celulares`
- etc.

## Exemplos

### Commit simples
```
feat(dashboard): adiciona card de recursos cadastrados
```

### Commit com corpo
```
fix(api): corrige erro de TypeScript no endpoint de notificações

- Adiciona type casting explícito para objetos do Mongoose
- Usa optional chaining para acessar propriedades
- Corrige erro de compilação TypeScript
```

### Commit de refatoração
```
refactor(dashboard): refatora dashboard principal com design moderno

- Adiciona interfaces TypeScript para melhor tipagem
- Melhora organização e estrutura do código
- Adiciona animações sutis e efeitos hover
- Melhora responsividade e layout
```

## Boas Práticas

1. **Use o imperativo**: "adiciona" ao invés de "adicionado" ou "adicionando"
2. **Seja específico**: Descreva o que foi feito de forma clara
3. **Use escopo quando relevante**: Facilita a navegação no histórico
4. **Adicione corpo para mudanças complexas**: Explique o "porquê" quando necessário
5. **Mantenha a primeira linha curta**: Máximo 72 caracteres
6. **Separe múltiplas mudanças**: Um commit por mudança lógica

## Histórico de Commits Organizados

### Padrão Atual (a partir de agora)
- `feat(escopo): descrição`
- `fix(escopo): descrição`
- `refactor(escopo): descrição`
- `style(escopo): descrição`
- `docs(escopo): descrição`
- `test(escopo): descrição`
- `chore(escopo): descrição`
- `perf(escopo): descrição`
- `ci(escopo): descrição`

