/**
 * Exemplo 02: Web Scraping com Apify
 *
 * Este exemplo demonstra:
 * - Scraping de páginas web usando Apify
 * - Extração de dados estruturados
 * - Configuração de parâmetros de scraping
 * - Tratamento de erros de rede
 */

import framework from '../core/index.js';

async function webScrapingExample() {
  console.log('🕷️  Exemplo 02: Web Scraping com Apify\n');

  try {
    // 1. Inicializar o framework
    console.log('📋 Inicializando framework...');
    await framework.initialize({
      autoEnforce: true,
      timeout: 60000 // 1 minuto para operações de scraping
    });
    console.log('✅ Framework inicializado!\n');

    // 2. Exemplo 1: Scraping básico de títulos
    console.log('📰 Exemplo 1: Scraping de títulos do Hacker News');
    const basicScraping = `
from servers.scraping.apify import run_actor

# Configuração básica de scraping
config = {
    'startUrls': [{'url': 'https://news.ycombinator.com/'}],
    'maxRequestsPerCrawl': 10,
    'selector': '.titleline > a',
    'maxDepth': 1
}

# Executar scraping
result = await run_actor('apify/web-scraper', config)
result
    `;

    console.log('🔄 Executando scraping...');
    const basicResult = await framework.execute(basicScraping);

    if (basicResult.success) {
      console.log(`✅ Scraping concluído!`);
      console.log(`📊 Status: ${basicResult.data.get('status', 'unknown')}`);
      console.log(`🔗 Dataset ID: ${basicResult.data.get('datasetId', 'N/A')}`);
      console.log(`⏱️  Duração: ${basicResult.data.get('duration', 'N/A')}s`);
    } else {
      console.log(`❌ Erro no scraping: ${basicResult.get('error', 'Erro desconhecido')}`);
    }

    // 3. Exemplo 2: Scraping com dados de exemplo (simulado)
    console.log('\n🏪 Exemplo 2: Scraping de produtos (simulação)');
    const productScraping = `
from servers.scraping.apify import run_actor

# Simula scraping de uma loja online
config = {
    'startUrls': [
        {'url': 'https://example-shop.com/products'},
        {'url': 'https://example-shop.com/categories/electronics'}
    ],
    'maxRequestsPerCrawl': 20,
    'selectors': {
        'title': 'h1.product-title',
        'price': '.price-current',
        'description': '.product-description',
        'image': 'img.product-image'
    },
    'maxDepth': 2,
    'waitFor': 2000  // Aguardar 2s entre requisições
}

# Como não temos acesso real, simulamos o resultado
simulated_result = {
    'success': True,
    'status': 'succeeded',
    'datasetId': 'demo-products-123',
    'duration': 15.5,
    'data': {
        'items': [
            {
                'title': 'Smartphone XYZ',
                'price': '$599.99',
                'description': 'Latest smartphone with advanced features',
                'image': 'https://example.com/phone.jpg'
            },
            {
                'title': 'Laptop Pro 15',
                'price': '$1299.99',
                'description': 'High-performance laptop for professionals',
                'image': 'https://example.com/laptop.jpg'
            },
            {
                'title': 'Wireless Headphones',
                'price': '$199.99',
                'description': 'Premium noise-cancelling headphones',
                'image': 'https://example.com/headphones.jpg'
            }
        ],
        'total': 3
    }
}

simulated_result
    `;

    console.log('🔄 Executando scraping de produtos...');
    const productResult = await framework.execute(productScraping);

    if (productResult.success && productResult.data) {
      console.log(`✅ Produtos encontrados: ${productResult.data.data.total}`);
      console.log('\n📦 Produtos extraídos:');

      productResult.data.data.items.forEach((item, index) => {
        console.log(`\n${index + 1}. ${item.title}`);
        console.log(`   💰 Preço: ${item.price}`);
        console.log(`   📝 Descrição: ${item.description}`);
      });
    }

    // 4. Exemplo 3: Scraping com paginação
    console.log('\n📄 Exemplo 3: Scraping com paginação (simulação)');
    const paginationScraping = `
from servers.scraping.apify import run_actor

# Configuração com paginação
config = {
    'startUrls': [{'url': 'https://example-blog.com/posts'}],
    'maxRequestsPerCrawl': 50,
    'selectors': {
        'title': 'h2.post-title',
        'author': '.post-author',
        'date': '.post-date',
        'content': '.post-content',
        'next_page': 'a.next-page'
    },
    'pagination': {
        'enabled': True,
        'selector': 'a.next-page',
        'max_pages': 5
    }
}

# Simula resultado com múltiplas páginas
simulated_blog_result = {
    'success': True,
    'status': 'succeeded',
    'datasetId': 'demo-blog-456',
    'pagesScraped': 3,
    'data': {
        'posts': [
            {
                'title': 'Getting Started with Web Scraping',
                'author': 'John Doe',
                'date': '2024-01-15',
                'content': 'Web scraping is a powerful technique...'
            },
            {
                'title': 'Advanced Scraping Techniques',
                'author': 'Jane Smith',
                'date': '2024-01-10',
                'content': 'In this article, we explore advanced methods...'
            }
        ],
        'totalPosts': 15
    }
}

simulated_blog_result
    `;

    console.log('🔄 Executando scraping com paginação...');
    const paginationResult = await framework.execute(paginationScraping);

    if (paginationResult.success) {
      console.log(`✅ Páginas raspadas: ${paginationResult.data.pagesScraped}`);
      console.log(`✅ Total de posts: ${paginationResult.data.data.totalPosts}`);
      console.log('\n📝 Posts do blog:');

      paginationResult.data.data.posts.forEach((post, index) => {
        console.log(`\n${index + 1}. "${post.title}"`);
        console.log(`   ✍️  Autor: ${post.author}`);
        console.log(`   📅 Data: ${post.date}`);
        console.log(`   📖 ${post.content.substring(0, 80)}...`);
      });
    }

    // 5. Obter dataset de resultados (simulação)
    console.log('\n📊 Exemplo 4: Obtendo dataset de resultados');
    const getDatasetCode = `
from servers.scraping.apify import get_dataset

# Simula obtenção de dataset
# Em produção, você usaria o datasetId real do resultado
result = await get_dataset('demo-products-123', {
    'format': 'json',
    'limit': 10
})

# Simulação do dataset
simulated_dataset = {
    'success': True,
    'data': {
        'items': [
            {'title': 'Product 1', 'price': '$99.99'},
            {'title': 'Product 2', 'price': '$149.99'},
            {'title': 'Product 3', 'price': '$79.99'}
        ],
        'total': 3,
        'offset': 0,
        'limit': 10
    }
}

simulated_dataset
    `;

    console.log('📥 Obtendo dataset...');
    const datasetResult = await framework.execute(getDatasetCode);

    if (datasetResult.success) {
      console.log(`✅ Dataset obtido: ${datasetResult.data.total} itens`);
      console.log(`📋 Formatado como: JSON`);
      console.log(`📏 Limitado a: ${datasetResult.data.limit} itens`);
    }

    // 6. Estatísticas do scraping
    console.log('\n📈 Estatísticas de scraping:');
    const scrapingStats = await framework.execute(`
# Calcular estatísticas dos resultados
results = [
    {'products': 3, 'duration': 15.5},
    {'posts': 15, 'duration': 25.3},
    {'items': 3, 'duration': 5.2}
]

total_items = sum(r.get('products', 0) + r.get('posts', 0) + r.get('items', 0) for r in results)
total_duration = sum(r['duration'] for r in results)
avg_duration = total_duration / len(results)

{
    'total_items_scraped': total_items,
    'total_duration': round(total_duration, 2),
    'average_duration': round(avg_duration, 2),
    'efficiency': round(total_items / total_duration, 2)
}
    `);

    console.log(`📊 Total de itens: ${scrapingStats.total_items_scraped}`);
    console.log(`⏱️  Duração total: ${scrapingStats.total_duration}s`);
    console.log(`⚡ Média por operação: ${scrapingStats.average_duration}s`);
    console.log(`🎯 Eficiência: ${scrapingStats.efficiency} itens/segundo`);

    // 7. Tratamento de erros comuns
    console.log('\n🚨 Exemplo 5: Tratamento de erros');
    const errorHandlingCode = `
from servers.scraping.apify import run_actor

# Simula diferentes tipos de erros
def simulate_scraping_errors():
    results = []

    # Erro 1: URL inválida
    try:
        result1 = await run_actor('apify/web-scraper', {
            'startUrls': [{'url': 'not-a-valid-url'}]
        })
        results.append({'error_type': 'invalid_url', 'handled': True})
    except Exception as e:
        results.append({'error_type': 'invalid_url', 'error': str(e)[:50]})

    # Erro 2: Timeout
    try:
        result2 = await run_actor('apify/web-scraper', {
            'startUrls': [{'url': 'https://slow-website.com'}],
            'timeout': 1  # 1 segundo muito curto
        })
        results.append({'error_type': 'timeout', 'handled': True})
    except Exception as e:
        results.append({'error_type': 'timeout', 'error': str(e)[:50]})

    return results

# Execute e retorna resultados
simulate_scraping_errors()
    `;

    console.log('🔍 Simulando erros de scraping...');
    const errorResults = await framework.execute(errorHandlingCode);

    console.log('\n📋 Erros simulados e tratados:');
    errorResults.forEach((error, index) => {
      console.log(`${index + 1}. ${error.error_type}: ${error.error || 'Sucesso'}`);
    });

  } catch (error) {
    console.error('❌ Erro durante o scraping:', error.message);

    if (error.code === 'TIMEOUT') {
      console.log('⏰ A operação demorou muito tempo. Considere aumentar o timeout.');
    } else if (error.code === 'MCP_NOT_FOUND') {
      console.log('🔍 MCP não encontrado. Verifique se Apify está configurado.');
    } else if (error.code === 'AUTH_FAILED') {
      console.log('🔑 Falha na autenticação. Verifique seu token do Apify.');
    }
  } finally {
    console.log('\n🧹 Finalizando framework...');
    await framework.cleanup();
    console.log('✅ Framework finalizado!');
  }
}

// Executar o exemplo
if (import.meta.url === `file://${process.argv[1]}`) {
  webScrapingExample().catch(error => {
    console.error('Erro fatal:', error);
    process.exit(1);
  });
}

export default webScrapingExample;