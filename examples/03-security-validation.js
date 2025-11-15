/**
 * Exemplo 03: Segurança e Validação com Guardrails
 *
 * Este exemplo demonstra:
 * - Validação de texto com Guardrails AI
 * - Detecção de conteúdo tóxico ou inadequado
 * - Identificação de PII (Informações de Identificação Pessoal)
 * - Validação de segurança de código
 */

import framework from '../core/index.js';

async function securityValidationExample() {
  console.log('🛡️  Exemplo 03: Segurança e Validação com Guardrails\n');

  try {
    // 1. Inicializar o framework com foco em segurança
    console.log('📋 Inicializando framework com segurança reforçada...');
    await framework.initialize({
      autoEnforce: true,
      timeout: 30000
    });
    console.log('✅ Framework inicializado com segurança ativa!\n');

    // 2. Exemplo 1: Validação básica de texto
    console.log('🔍 Exemplo 1: Validação básica de texto');

    const textosParaValidar = [
      "Hello world! This is a friendly message.",
      "I think this product is terrible and I hate it!",
      "Contact me at john.doe@example.com for more info.",
      "The meeting is scheduled for tomorrow at 3 PM."
    ];

    const basicValidationCode = `
from servers.security.guardrails import validate

def validate_texts(texts):
    results = []

    for text in texts:
        # Validação básica com diferentes níveis de severidade
        result_strict = await validate(text, {'strict': True})
        result_normal = await validate(text, {'strict': False})

        results.append({
            'text': text[:50] + '...' if len(text) > 50 else text,
            'strict_validation': {
                'valid': result_strict.get('valid', False),
                'score': result_strict.get('score', 0),
                'issues': result_strict.get('issues', [])
            },
            'normal_validation': {
                'valid': result_normal.get('valid', False),
                'score': result_normal.get('score', 0),
                'issues': result_normal.get('issues', [])
            }
        })

    return results

# Execute validação
validate_texts(texts)
    `;

    console.log('🔄 Validando textos...');
    const validationResults = await framework.execute(basicValidationCode, { texts: textosParaValidar });

    console.log('\n📊 Resultados da validação:');
    validationResults.forEach((result, index) => {
      console.log(`\n${index + 1}. Texto: "${result.text}"`);
      console.log(`   🔒 Modo estrito: ${result.strict_validation.valid ? '✅ Aprovado' : '❌ Rejeitado'} (score: ${result.strict_validation.score})`);
      console.log(`   🔓 Modo normal: ${result.normal_validation.valid ? '✅ Aprovado' : '❌ Rejeitado'} (score: ${result.normal_validation.score})`);

      if (result.strict_validation.issues.length > 0) {
        console.log(`   ⚠️  Problemas (estrito): ${result.strict_validation.issues.join(', ')}`);
      }
      if (result.normal_validation.issues.length > 0) {
        console.log(`   💡 Observações (normal): ${result.normal_validation.issues.join(', ')}`);
      }
    });

    // 3. Exemplo 2: Detecção de PII (Informações de Identificação Pessoal)
    console.log('\n🔍 Exemplo 2: Detecção de PII');

    const textosComPII = [
      "Contact John Doe at john.doe@example.com or call 555-1234-5678.",
      "My SSN is 123-45-6789 and I live at 123 Main St, Cityville.",
      "Meet me at the office tomorrow at 3 PM to discuss the project.",
      "Email: jane.smith@company.com | Phone: +1-555-987-6543 | Address: 456 Oak Ave"
    ];

    const piiDetectionCode = `
from servers.security.guardrails import scan

def detect_pii(texts):
    pii_results = []

    for text in texts:
        # Scan específico para PII
        result = await scan(text, 'privacy')

        pii_results.append({
            'text': text[:60] + '...' if len(text) > 60 else text,
            'has_pii': len(result.get('issues', [])) > 0,
            'issues_found': result.get('issues', []),
            'risk_level': result.get('risk_level', 'low'),
            'recommendations': result.get('recommendations', [])
        })

    return pii_results

# Execute detecção de PII
pii_results = detect_pii(texts)
    `;

    console.log('🔍 Escaneando textos para PII...');
    const piiResults = await framework.execute(piiDetectionCode, { texts: textosComPII });

    console.log('\n📋 Resultados da detecção de PII:');
    piiResults.forEach((result, index) => {
      console.log(`\n${index + 1}. Texto: "${result.text}"`);
      console.log(`   🔍 PII detectado: ${result.has_pii ? '⚠️ SIM' : '✅ NÃO'}`);
      console.log(`   📊 Nível de risco: ${result.risk_level}`);

      if (result.has_pii) {
        console.log(`   📋 PII encontrado: ${result.issues_found.join(', ')}`);
        console.log(`   💡 Recomendações: ${result.recommendations.join(', ')}`);
      }
    });

    // 4. Exemplo 3: Validação de segurança de código
    console.log('\n💻 Exemplo 3: Validação de segurança de código');

    const codigosParaValidar = [
      "x = 1 + 1\nprint('Hello World')",
      "import os\nos.system('rm -rf /')",
      "user_input = input('Enter command: ')\neval(user_input)",
      "def safe_function():\n    return 'This is safe code'"
    ];

    const codeValidationCode = `
from servers.security.guardrails import scan

def validate_code_security(codes):
    validation_results = []

    for code in codes:
        # Scan específico para código
        result = await scan(code, 'security')

        validation_results.append({
            'code': code[:50] + '...' if len(code) > 50 else code,
            'is_safe': result.get('valid', True),
            'security_score': result.get('score', 1.0),
            'security_issues': result.get('issues', []),
            'risk_assessment': result.get('risk_level', 'unknown')
        })

    return validation_results

# Execute validação de código
validate_code_security(codes)
    `;

    console.log('🔒 Validando segurança de códigos...');
    const codeValidationResults = await framework.execute(codeValidationCode, { codes: codigosParaValidar });

    console.log('\n🔐 Resultados da validação de código:');
    codeValidationResults.forEach((result, index) => {
      console.log(`\n${index + 1}. Código: "${result.code}"`);
      console.log(`   🛡️  Segurança: ${result.is_safe ? '✅ SEGURO' : '❌ INSEGURO'}`);
      console.log(`   📊 Score de segurança: ${result.security_score}`);
      console.log(`   📋 Avaliação de risco: ${result.risk_assessment}`);

      if (result.security_issues.length > 0) {
        console.log(`   ⚠️  Problemas de segurança: ${result.security_issues.join(', ')}`);
      }
    });

    // 5. Exemplo 4: Configurações avançadas de validação
    console.log('\n⚙️  Exemplo 4: Configurações avançadas de validação');

    const configuracoesDeValidacao = [
      {'strict': True, 'check_toxicity': True, 'check_pii': True},
      {'strict': False, 'check_toxicity': False, 'check_pii': True},
      {'strict': True, 'max_length': 100, 'min_length': 10},
      {'strict': False, 'allowed_patterns': ['email', 'phone']}
    ];

    const advancedValidationCode = `
from servers.security.guardrails import validate, scan

def advanced_validation_example(text, configs):
    results = []

    for i, config in enumerate(configs):
        # Aplica validação com configuração específica
        if 'check_toxicity' in config or 'check_pii' in config:
            result = await validate(text, config)
            result_type = 'validation'
        else:
            result = await scan(text, 'custom', config)
            result_type = 'scan'

        results.append({
            'config_index': i + 1,
            'config': config,
            'result_type': result_type,
            'success': result.get('valid', True) or result.get('success', True),
            'score': result.get('score', 0),
            'issues': result.get('issues', []),
            'details': result
        })

    return results

# Texto de teste
sample_text = "Contact our support team at support@example.com for assistance."

# Execute validações avançadas
advanced_validation_example(sample_text, configs)
    `;

    console.log('⚙️  Testando configurações avançadas...');
    const advancedResults = await framework.execute(advancedValidationCode, {
      text: "Contact our support team at support@example.com for assistance.",
      configs: configuracoesDeValidacao
    });

    console.log('\n📊 Resultados das validações avançadas:');
    advancedResults.forEach((result) => {
      console.log(`\nConfiguração ${result.config_index} (${result.result_type}):`);
      console.log(`   ⚙️  Config: ${JSON.stringify(result.config)}`);
      console.log(`   ✅ Sucesso: ${result.success}`);
      console.log(`   📊 Score: ${result.score}`);
      console.log(`   📋 Issues: ${result.issues.length}`);
    });

    // 6. Estatísticas de segurança
    console.log('\n📈 Estatísticas de segurança:');
    const securityStats = await framework.execute(`
# Calcular estatísticas de segurança dos resultados
validation_results = [
    {'valid': True, 'score': 0.95, 'issues': 0},
    {'valid': False, 'score': 0.3, 'issues': 2},
    {'valid': True, 'score': 0.8, 'issues': 1},
    {'valid': False, 'score': 0.1, 'issues': 3}
]

total_checks = len(validation_results)
valid_checks = sum(1 for r in validation_results if r['valid'])
invalid_checks = total_checks - valid_checks
avg_score = sum(r['score'] for r in validation_results) / total_checks
total_issues = sum(r['issues'] for r in validation_results)

{
    'total_security_checks': total_checks,
    'valid_checks': valid_checks,
    'invalid_checks': invalid_checks,
    'success_rate': round((valid_checks / total_checks) * 100, 1),
    'average_security_score': round(avg_score, 3),
    'total_security_issues': total_issues,
    'issues_per_check': round(total_issues / total_checks, 2)
}
    `);

    console.log(`🔍 Total de verificações: ${securityStats.total_security_checks}`);
    console.log(`✅ Verificações válidas: ${securityStats.valid_checks}`);
    console.log(`❌ Verificações inválidas: ${securityStats.invalid_checks}`);
    console.log(`📊 Taxa de sucesso: ${securityStats.success_rate}%`);
    console.log(`📈 Score médio de segurança: ${securityStats.average_security_score}`);
    console.log(`⚠️  Total de issues: ${securityStats.total_security_issues}`);
    console.log(`📋 Issues por verificação: ${securityStats.issues_per_check}`);

    // 7. Recomendações de segurança
    console.log('\n💡 Recomendações de segurança:');
    const securityRecommendations = await framework.execute(`
# Gerar recomendações baseadas nos resultados
security_recommendations = [
    "Sempre use o modo 'strict' para validações críticas",
    "Configure timeouts apropriados para operações de segurança",
    "Implemente rate limiting para prevenir abuso",
    "Use HTTPS para todas as comunicações sensíveis",
    "Valide e sanitize todas as entradas do usuário",
    "Implemente logs de segurança para auditoria",
    "Configure alertas para violações de segurança",
    "Teste regularmente suas configurações de segurança"
]

# Simula análise e recomendações personalizadas
{
    'general_recommendations': security_recommendations,
    'priority_recommendations': security_recommendations[:3],
    'implementation_checklist': [
        '✅ Configurar validação de entrada',
        '✅ Implementar rate limiting',
        '⏳ Configurar HTTPS',
        '⏳ Implementar logs de segurança',
        '⏳ Configurar alertas'
    ]
}
    `);

    console.log('\n🎯 Recomendações prioritárias:');
    securityRecommendations.priority_recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });

    console.log('\n✅ Checklist de implementação:');
    securityRecommendations.implementation_checklist.forEach((item) => {
      console.log(`   ${item}`);
    });

  } catch (error) {
    console.error('❌ Erro durante validação de segurança:', error.message);

    if (error.code === 'AUTH_FAILED') {
      console.log('🔑 Verifique suas credenciais do Guardrails AI.');
    } else if (error.code === 'TIMEOUT') {
      console.log('⏰ A validação demorou muito. Verifique sua conexão.');
    } else if (error.code === 'ENFORCEMENT_VIOLATION') {
      console.log('🛡️  Violação de segurança detectada. Use framework.execute().');
    }
  } finally {
    console.log('\n🧹 Finalizando framework...');
    await framework.cleanup();
    console.log('✅ Framework finalizado com segurança!');
  }
}

// Executar o exemplo
if (import.meta.url === `file://${process.argv[1]}`) {
  securityValidationExample().catch(error => {
    console.error('Erro fatal:', error);
    process.exit(1);
  });
}

export default securityValidationExample;"file_path":"C:\Users\thiag\Projects\MCP-Code-Execution-Framework\examples\03-security-validation.js