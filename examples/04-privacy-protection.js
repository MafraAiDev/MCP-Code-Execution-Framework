/**
 * Exemplo 04: Proteção de Dados Pessoais e Privacidade
 *
 * Este exemplo demonstra:
 * - Detecção e mascaramento de PII (Informações de Identificação Pessoal)
 * - Cumprimento de regulamentações de privacidade (GDPR, LGPD)
 * - Anonimização de dados
 * - Consentimento e controle de dados
 */

import framework from '../core/index.js';

async function privacyProtectionExample() {
  console.log('🔒 Exemplo 04: Proteção de Dados Pessoais e Privacidade\n');

  try {
    // 1. Inicializar o framework com configurações de privacidade
    console.log('📋 Inicializando framework com proteção de privacidade...');
    await framework.initialize({
      autoEnforce: true,
      timeout: 45000,
      // Configurações específicas de privacidade seriam aplicadas aqui
    });
    console.log('✅ Framework inicializado com proteção de privacidade!\n');

    // 2. Exemplo 1: Detecção de PII em textos
    console.log('🔍 Exemplo 1: Detecção de PII em textos');

    const textosComDadosPessoais = [
      "Contact John Smith at john.smith@email.com or call 555-123-4567.",
      "My social security number is 123-45-6789 and I live at 123 Main Street.",
      "Please email jane.doe@company.com with your phone number +1-555-987-6543.",
      "The customer's credit card 4532-1234-5678-9012 was charged $150.00.",
      "Employee ID: EMP-2024-001, Department: Engineering, Salary: $75,000/year"
    ];

    const piiDetectionCode = `
from servers.security.guardrails import scan
import re

def detect_pii_advanced(texts):
    pii_results = []

    # Padrões regex para diferentes tipos de PII
    pii_patterns = {
        'email': r'\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b',
        'phone': r'\\b(?:\\+?1[-.\\s]?)?\\(?([0-9]{3})\\)?[-.\\s]?([0-9]{3})[-.\\s]?([0-9]{4})\\b',
        'ssn': r'\\b\\d{3}-\\d{2}-\\d{4}\\b',
        'credit_card': r'\\b\\d{4}[\\s-]?\\d{4}[\\s-]?\\d{4}[\\s-]?\\d{4}\\b',
        'address': r'\\b\\d+\\s+[A-Za-z0-9\\s,.-]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd)\\b',
        'employee_id': r'\\b[A-Z]{2,4}-\\d{4}-\\d{1,4}\\b',
        'salary': r'\\$\\d{1,3}(?:,\\d{3})*(?:\\.\\d{2})?(?:/year|/month|/week)?'
    }

    for text in texts:
        # Usar Guardrails para scan de privacidade
        privacy_result = await scan(text, 'privacy')

        # Detecção adicional com regex
        detected_pii = {}
        for pii_type, pattern in pii_patterns.items():
            matches = re.findall(pattern, text)
            if matches:
                detected_pii[pii_type] = len(matches)

        pii_results.append({
            'original_text': text[:80] + '...' if len(text) > 80 else text,
            'privacy_scan': {
                'has_pii': len(privacy_result.get('issues', [])) > 0,
                'issues': privacy_result.get('issues', []),
                'risk_level': privacy_result.get('risk_level', 'low')
            },
            'regex_detection': detected_pii,
            'total_pii_count': sum(detected_pii.values()) + len(privacy_result.get('issues', [])),
            'pii_types_found': list(detected_pii.keys()) + privacy_result.get('issues', [])
        })

    return pii_results

# Execute detecção de PII
pii_detection_results = detect_pii_advanced(texts)
    `;

    console.log('🔍 Escaneando textos para PII...');
    const piiResults = await framework.execute(piiDetectionCode, { texts: textosComDadosPessoais });

    console.log('\n📊 Resultados da detecção de PII:');
    piiResults.forEach((result, index) => {
      console.log(`\n${index + 1}. Texto: "${result.original_text}"`);
      console.log(`   🔍 Scan de privacidade: ${result.privacy_scan.has_pii ? '⚠️ PII detectado' : '✅ Limpo'}`);
      console.log(`   📊 Nível de risco: ${result.privacy_scan.risk_level}`);
      console.log(`   🔢 Total de PII: ${result.total_pii_count}`);

      if (result.pii_types_found.length > 0) {
        console.log(`   📋 Tipos de PII: ${result.pii_types_found.join(', ')}`);
      }

      if (Object.keys(result.regex_detection).length > 0) {
        console.log(`   🔍 Detecção regex:`);
        Object.entries(result.regex_detection).forEach(([type, count]) => {
          console.log(`      - ${type}: ${count} ocorrência(s)`);
        });
      }
    });

    // 3. Exemplo 2: Mascaramento e anonimização de dados
    console.log('\n🎭 Exemplo 2: Mascaramento e anonimização de dados');

    const anonymizationCode = `
import re

def anonymize_text(text):
    """
    Anonimiza texto mascarando PII detectada
    """
    anonymized = text

    # Email -> ***@***.***
    anonymized = re.sub(
        r'\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b',
        '***@***.***',
        anonymized
    )

    # Telefone -> ***-***-****
    anonymized = re.sub(
        r'\\b\\d{3}-\\d{2}-\\d{4}\\b',
        '***-**-****',
        anonymized
    )

    # Telefone alternativo -> ***-***-****
    anonymized = re.sub(
        r'\\b\\d{3}-\\d{3}-\\d{4}\\b',
        '***-***-****',
        anonymized
    )

    # Cartão de crédito -> ****-****-****-****
    anonymized = re.sub(
        r'\\b\\d{4}[\\s-]?\\d{4}[\\s-]?\\d{4}[\\s-]?\\d{4}\\b',
        '****-****-****-****',
        anonymized
    )

    # Nomes próprios (simplificado) -> [NOME]
    # Nota: Em produção, use NER (Named Entity Recognition)
    common_names = ['John', 'Jane', 'Smith', 'Doe', 'Mary', 'Robert']
    for name in common_names:
        anonymized = re.sub(rf'\\b{name}\\b', '[NOME]', anonymized, flags=re.IGNORECASE)

    # Endereços -> [ENDEREÇO]
    anonymized = re.sub(
        r'\\b\\d+\\s+[A-Za-z0-9\\s,.-]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd)\\b',
        '[ENDEREÇO]',
        anonymized
    )

    # IDs de funcionado -> [ID]
    anonymized = re.sub(
        r'\\b[A-Z]{2,4}-\\d{4}-\\d{1,4}\\b',
        '[ID]',
        anonymized
    )

    # Salários -> $[SALÁRIO]
    anonymized = re.sub(
        r'\\$\\d{1,3}(?:,\\d{3})*(?:/year|/month|/week)?',
        '$[SALÁRIO]',
        anonymized
    )

    return anonymized

def anonymize_dataset(texts):
    """
    Anonimiza um conjunto de textos
    """
    anonymized_data = []

    for original_text in texts:
        anonymized_text = anonymize_text(original_text)
        anonymized_data.append({
            'original': original_text,
            'anonymized': anonymized_text,
            'anonymization_ratio': len(anonymized_text) / len(original_text),
            'pii_masked': len(original_text) - len(anonymized_text.replace('*', '').replace('[', ''))
        })

    return anonymized_data

# Execute anonimização
anonymized_results = anonymize_dataset(texts)
    `;

    console.log('🎭 Anonimizando textos...');
    const anonymizedResults = await framework.execute(anonymizationCode, { texts: textosComDadosPessoais });

    console.log('\n🎭 Resultados da anonimização:');
    anonymizedResults.forEach((result, index) => {
      console.log(`\n${index + 1}. Texto original: "${result.original}"`);
      console.log(`   🎭 Texto anonimizado: "${result.anonymized}"`);
      console.log(`   📊 Taxa de anonimização: ${(result.anonymization_ratio * 100).toFixed(1)}%`);
      console.log(`   🔢 Caracteres PII mascarados: ${result.pii_masked}`);
    });

    // 4. Exemplo 3: Consentimento e controle de dados
    console.log('\n✅ Exemplo 3: Consentimento e controle de dados');

    const consentManagementCode = `
# Simulação de sistema de consentimento e controle de dados
class ConsentManager:
    def __init__(self):
        self.consent_records = {}
        self.data_retention_policies = {
            'user_profile': 365,  # 1 ano
            'browsing_data': 90,  # 3 meses
            'security_logs': 730,  # 2 anos
            'marketing_data': 180  # 6 meses
        }

    def record_consent(self, user_id, data_type, consent_given, timestamp):
        self.consent_records[user_id] = {
            'data_type': data_type,
            'consent_given': consent_given,
            'timestamp': timestamp,
            'retention_days': self.data_retention_policies.get(data_type, 365)
        }

    def check_consent(self, user_id, data_type):
        record = self.consent_records.get(user_id)
        if record and record['data_type'] == data_type:
            return record['consent_given']
        return False

    def get_data_retention_policy(self, data_type):
        return self.data_retention_policies.get(data_type, 365)

    def generate_privacy_report(self, user_id):
        record = self.consent_records.get(user_id)
        if not record:
            return {'error': 'No consent record found'}

        return {
            'user_id': user_id,
            'data_type': record['data_type'],
            'consent_status': record['consent_given'],
            'consent_timestamp': record['timestamp'],
            'retention_days': record['retention_days'],
            'expiry_date': '2025-12-31',  # Simulação
            'rights': ['access', 'rectification', 'erasure', 'portability']
        }

# Criar gerenciador de consentimento
consent_manager = ConsentManager()

# Registrar consentimentos de exemplo
consent_manager.record_consent('user_123', 'user_profile', True, '2024-01-15T10:30:00Z')
consent_manager.record_consent('user_456', 'marketing_data', False, '2024-01-16T14:20:00Z')
consent_manager.record_consent('user_789', 'browsing_data', True, '2024-01-17T09:15:00Z')

# Verificar consentimentos
consent_results = []
for user_id in ['user_123', 'user_456', 'user_789']:
    consent_record = consent_manager.consent_records[user_id]
    consent_results.append({
        'user_id': user_id,
        'data_type': consent_record['data_type'],
        'consent_given': consent_record['consent_given'],
        'retention_policy': consent_manager.get_data_retention_policy(consent_record['data_type']),
        'privacy_report': consent_manager.generate_privacy_report(user_id)
    })

{
    'consent_results': consent_results,
    'summary': {
        'total_users': len(consent_results),
        'users_with_consent': sum(1 for r in consent_results if r['consent_given']),
        'users_without_consent': sum(1 for r in consent_results if not r['consent_given']),
        'data_types': list(set(r['data_type'] for r in consent_results))
    }
}
    `;

    console.log('✅ Gerenciando consentimentos...');
    const consentResults = await framework.execute(consentManagementCode);

    console.log('\n📊 Resultados do gerenciamento de consentimento:');
    consentResults.consent_results.forEach((result) => {
      console.log(`\n👤 Usuário: ${result.user_id}`);
      console.log(`   📋 Tipo de dados: ${result.data_type}`);
      console.log(`   ✅ Consentimento: ${result.consent_given ? 'SIM' : 'NÃO'}`);
      console.log(`   📅 Política de retenção: ${result.retention_policy} dias`);

      if (result.privacy_report.consent_status !== undefined) {
        console.log(`   📄 Direitos disponíveis: ${result.privacy_report.rights.join(', ')}`);
      }
    });

    console.log(`\n📈 Resumo: ${consentResults.summary.users_with_consent} com consentimento, ${consentResults.summary.users_without_consent} sem consentimento`);

    // 5. Estatísticas de privacidade
    console.log('\n📈 Estatísticas de privacidade:');
    const privacyStats = await framework.execute(`
# Calcular estatísticas de privacidade
privacy_stats = {
    'total_texts_analyzed': len(textos_com_dados_pessoais),
    'texts_with_pii': sum(1 for r in pii_results if r['privacy_scan']['has_pii']),
    'total_pii_instances': sum(r['total_pii_count'] for r in pii_results),
    'anonymization_success_rate': 100,  # Simulação - todos anonimizados com sucesso
    'average_anonymization_ratio': sum(r['anonymization_ratio'] for r in anonymized_results) / len(anonymized_results),
    'consent_compliance_rate': (consent_results['summary']['users_with_consent'] / consent_results['summary']['total_users']) * 100
}

privacy_stats
    `);

    console.log(`📊 Textos analisados: ${privacyStats.total_texts_analyzed}`);
    console.log(`🔍 Textos com PII: ${privacyStats.texts_with_pii}`);
    console.log(`📋 Total de instâncias de PII: ${privacyStats.total_pii_instances}`);
    console.log(`✅ Taxa de sucesso de anonimização: ${privacyStats.anonymization_success_rate}%`);
    console.log(`📊 Taxa média de anonimização: ${(privacyStats.average_anonymization_ratio * 100).toFixed(1)}%`);
    console.log(`✅ Taxa de conformidade de consentimento: ${privacyStats.consent_compliance_rate.toFixed(1)}%`);

    // 6. Conformidade regulatória
    console.log('\n📋 Exemplo 6: Conformidade regulatória');

    const complianceCode = `
# Simulação de conformidade com regulamentações
def check_gdpr_compliance(data_processing):
    """
    Verifica conformidade básica com GDPR
    """
    requirements = {
        'lawful_basis': False,
        'purpose_limitation': False,
        'data_minimization': False,
        'accuracy': False,
        'storage_limitation': False,
        'integrity_confidentiality': False,
        'accountability': False
    }

    # Verifica cada requisito
    if data_processing.get('consent') or data_processing.get('contract') or data_processing.get('legal_obligation'):
        requirements['lawful_basis'] = True

    if data_processing.get('specific_purposes'):
        requirements['purpose_limitation'] = True

    if data_processing.get('data_minimized'):
        requirements['data_minimization'] = True

    if data_processing.get('data_accurate'):
        requirements['accuracy'] = True

    if data_processing.get('retention_policy'):
        requirements['storage_limitation'] = True

    if data_processing.get('security_measures'):
        requirements['integrity_confidentiality'] = True

    if data_processing.get('documentation'):
        requirements['accountability'] = True

    compliance_score = sum(requirements.values()) / len(requirements)

    return {
        'gdpr_compliance_score': round(compliance_score * 100, 1),
        'requirements_met': requirements,
        'compliant': compliance_score >= 0.8,  # 80% ou mais = conforme
        'recommendations': [
            'Implementar consentimento explícito' if not requirements['lawful_basis'] else None,
            'Definir propósitos específicos' if not requirements['purpose_limitation'] else None,
            'Minimizar dados coletados' if not requirements['data_minimization'] else None,
            'Garantir precisão dos dados' if not requirements['accuracy'] else None,
            'Estabelecer política de retenção' if not requirements['storage_limitation'] else None,
            'Implementar medidas de segurança' if not requirements['integrity_confidentiality'] else None,
            'Manter documentação' if not requirements['accountability'] else None
        ]
    }

# Exemplo de processamento de dados
data_processing_example = {
    'consent': True,
    'specific_purposes': ['analytics', 'improvement'],
    'data_minimized': True,
    'data_accurate': True,
    'retention_policy': 365,
    'security_measures': ['encryption', 'access_control'],
    'documentation': True
}

gdpr_compliance = check_gdpr_compliance(data_processing_example)

{
    'gdpr_compliance_check': gdpr_compliance,
    'regulatory_summary': {
        'gdpr_score': gdpr_compliance['gdpr_compliance_score'],
        'is_gdpr_compliant': gdpr_compliance['compliant'],
        'missing_requirements': [req for req, met in gdpr_compliance['requirements_met'].items() if not met]
    }
}
    `;

    console.log('📋 Verificando conformidade GDPR...');
    const complianceResult = await framework.execute(complianceCode);

    console.log(`\n📊 Score de conformidade GDPR: ${complianceResult.gdpr_compliance_check.gdpr_compliance_score}%`);
    console.log(`✅ Conforme com GDPR: ${complianceResult.gdpr_compliance_check.compliant ? 'SIM' : 'NÃO'}`);

    if (complianceResult.regulatory_summary.missing_requirements.length > 0) {
      console.log(`📋 Requisitos faltando: ${complianceResult.regulatory_summary.missing_requirements.join(', ')}`);
    }

  } catch (error) {
    console.error('❌ Erro durante proteção de privacidade:', error.message);

    if (error.code === 'PRIVACY_VIOLATION') {
      console.log('🔒 Violação de privacidade detectada. Revise suas configurações.');
    } else if (error.code === 'TIMEOUT') {
      console.log('⏰ Operação de privacidade demorou. Verifique a complexidade dos dados.');
    }
  } finally {
    console.log('\n🧹 Finalizando framework...');
    await framework.cleanup();
    console.log('✅ Framework finalizado com privacidade protegida!');
  }
}

// Executar o exemplo
if (import.meta.url === `file://${process.argv[1]}`) {
  privacyProtectionExample().catch(error => {
    console.error('Erro fatal:', error);
    process.exit(1);
  });
}

export default privacyProtectionExample;