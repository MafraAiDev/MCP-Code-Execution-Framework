#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Teste manual dos MCPs reais implementados
"""
import asyncio
import sys
import os

# Add servers directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'servers'))

from scraping.apify.run_actor import run_actor
from scraping.apify.get_dataset import get_dataset
from security.guardrails.validate import validate
from security.guardrails.scan import scan

async def test_run_actor():
    """Test Apify run_actor function"""
    print("\n[TEST] Testing run_actor...")
    try:
        result = await run_actor('apify/web-scraper', {
            'startUrls': [{'url': 'https://example.com'}],
            'maxRequestsPerCrawl': 10
        })

        print(f"[OK] run_actor result: {result}")
        return result.get('success', False)
    except Exception as e:
        print(f"[ERROR] run_actor error: {e}")
        return False

async def test_get_dataset():
    """Test Apify get_dataset function"""
    print("\n[TEST] Testing get_dataset...")
    try:
        result = await get_dataset('test-dataset-123', {
            'offset': 0,
            'limit': 10
        })

        print(f"[OK] get_dataset result: {result}")
        return result.get('success', False)
    except Exception as e:
        print(f"[ERROR] get_dataset error: {e}")
        return False

async def test_validate():
    """Test Guardrails validate function"""
    print("\n[TEST] Testing validate...")
    try:
        result = await validate('This is a test prompt for validation', {
            'strict': True,
            'check_toxicity': True
        })

        print(f"[OK] validate result: {result}")
        return result.get('success', False)
    except Exception as e:
        print(f"[ERROR] validate error: {e}")
        return False

async def test_scan():
    """Test Guardrails scan function"""
    print("\n[TEST] Testing scan...")
    try:
        result = await scan('const password = "secret123";', 'security')

        print(f"[OK] scan result: {result}")
        return result.get('success', False)
    except Exception as e:
        print(f"[ERROR] scan error: {e}")
        return False

async def main():
    """Run all tests"""
    print("[START] Iniciando testes manuais dos MCPs reais...")

    tests = [
        ("run_actor", test_run_actor),
        ("get_dataset", test_get_dataset),
        ("validate", test_validate),
        ("scan", test_scan)
    ]

    results = {}

    for test_name, test_func in tests:
        try:
            success = await test_func()
            results[test_name] = success
        except Exception as e:
            print(f"[ERROR] {test_name} failed with exception: {e}")
            results[test_name] = False

    print("\n[SUMMARY] RESUMO DOS TESTES:")
    print("=" * 40)
    for test_name, success in results.items():
        status = "[PASS]" if success else "[FAIL]"
        print(f"{test_name}: {status}")

    total_passed = sum(results.values())
    total_tests = len(results)

    print(f"\n[STATS] Total: {total_passed}/{total_tests} testes passaram")

    if total_passed == total_tests:
        print("[SUCCESS] Todos os MCPs reais estão funcionando!")
        return 0
    else:
        print("[WARNING] Alguns testes falharam - verificar implementação")
        return 1

if __name__ == '__main__':
    exit_code = asyncio.run(main())
    sys.exit(exit_code)