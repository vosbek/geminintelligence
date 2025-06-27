#!/usr/bin/env python3
"""
AI Intelligence Platform - Export Data Analysis

This script analyzes exported intelligence data and provides insights
into what was collected from all 11 data sources.

Usage:
    python database/analyze_exports.py --data-dir ./exports

This is the perfect script to run when investigating collected intelligence data!
"""

import json
import argparse
from pathlib import Path
from collections import Counter, defaultdict

def analyze_intelligence_data(data_file):
    """Analyze the comprehensive intelligence dataset."""
    print("🔍 AI Intelligence Platform - Data Analysis")
    print("=" * 60)
    
    with open(data_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    export_info = data['export_info']
    tools = data['tools']
    summary_stats = data['summary_stats']
    
    # Basic overview
    print(f"📊 EXPORT OVERVIEW")
    print(f"   Export timestamp: {export_info['timestamp']}")
    print(f"   Total tools tracked: {export_info['total_tools']}")
    print(f"   Total snapshots: {export_info['total_snapshots']}")
    print(f"   Data sources available: {len(export_info['data_sources_available'])}")
    print()
    
    # Data sources breakdown
    print(f"🌐 DATA SOURCES COLLECTED ({len(export_info['data_sources_available'])})")
    for i, source in enumerate(export_info['data_sources_available'], 1):
        source_display = {
            'primary_website': '🌐 Website Content (Firecrawl)',
            'github_data': '📚 GitHub Repository Metrics', 
            'reddit_data': '💬 Reddit Community Discussions',
            'hackernews_data': '🔥 HackerNews Technical Stories',
            'stackoverflow_data': '❓ StackOverflow Developer Questions',
            'devto_data': '✍️ Dev.to Technical Articles',
            'npm_data': '📦 NPM Package Ecosystem',
            'pypi_data': '🐍 PyPI Package Registry',
            'news_data': '📰 News Articles & Coverage',
            'medium_data': '📝 Medium Technical Content',
            'producthunt_data': '🚀 ProductHunt Community',
            'stock_data': '💰 Financial/Stock Data'
        }.get(source, f"🔹 {source}")
        print(f"   {i:2d}. {source_display}")
    print()
    
    # Tools analysis
    tools_with_data = 0
    tools_without_data = 0
    snapshots_per_tool = []
    
    print(f"🛠️  TOOLS ANALYSIS")
    for tool_name, tool_data in tools.items():
        snapshot_count = len(tool_data['snapshots'])
        if snapshot_count > 0:
            tools_with_data += 1
            snapshots_per_tool.append(snapshot_count)
        else:
            tools_without_data += 1
    
    print(f"   Tools with intelligence data: {tools_with_data}")
    print(f"   Tools without data: {tools_without_data}")
    if snapshots_per_tool:
        print(f"   Average snapshots per tool: {sum(snapshots_per_tool)/len(snapshots_per_tool):.1f}")
        print(f"   Max snapshots for a tool: {max(snapshots_per_tool)}")
    print()
    
    # Detailed tool breakdown
    print(f"📋 DETAILED TOOL BREAKDOWN")
    for tool_name, tool_data in sorted(tools.items()):
        tool_info = tool_data['tool_info']
        snapshot_count = len(tool_data['snapshots'])
        
        status_icon = "✅" if snapshot_count > 0 else "⚪"
        print(f"   {status_icon} {tool_name:<20} | {snapshot_count:2d} snapshots | {tool_info['category'] or 'No category'}")
        
        if snapshot_count > 0:
            latest_snapshot = tool_data['snapshots'][0]
            raw_data = latest_snapshot.get('raw_data', {})
            sources_collected = len([k for k, v in raw_data.items() if v and not (isinstance(v, dict) and v.get('error'))])
            print(f"      └─ Latest: {latest_snapshot['snapshot_date'][:10]} | {sources_collected}/{len(export_info['data_sources_available'])} sources successful")
    print()
    
    # Data quality analysis
    print(f"📈 DATA QUALITY ANALYSIS")
    source_success_rates = defaultdict(int)
    total_snapshots = sum(len(tool_data['snapshots']) for tool_data in tools.values())
    
    for tool_data in tools.values():
        for snapshot in tool_data['snapshots']:
            raw_data = snapshot.get('raw_data', {})
            for source in export_info['data_sources_available']:
                if source in raw_data:
                    source_data = raw_data[source]
                    # Consider successful if not empty and no error
                    if source_data and not (isinstance(source_data, dict) and source_data.get('error')):
                        source_success_rates[source] += 1
    
    print(f"   Success rates by data source:")
    for source in sorted(export_info['data_sources_available']):
        success_rate = (source_success_rates[source] / total_snapshots * 100) if total_snapshots > 0 else 0
        source_display = {
            'primary_website': 'Website Content',
            'github_data': 'GitHub Data', 
            'reddit_data': 'Reddit Discussions',
            'hackernews_data': 'HackerNews Stories',
            'stackoverflow_data': 'StackOverflow Q&A',
            'devto_data': 'Dev.to Articles',
            'npm_data': 'NPM Packages',
            'pypi_data': 'PyPI Packages',
            'news_data': 'News Articles',
            'medium_data': 'Medium Articles',
            'producthunt_data': 'ProductHunt Data',
            'stock_data': 'Stock Data'
        }.get(source, source)
        
        rate_icon = "🟢" if success_rate > 80 else "🟡" if success_rate > 50 else "🔴"
        print(f"      {rate_icon} {source_display:<20}: {success_rate:5.1f}% ({source_success_rates[source]}/{total_snapshots})")
    print()
    
    # Community metrics highlights
    print(f"🌟 COMMUNITY METRICS HIGHLIGHTS")
    github_stars = []
    reddit_mentions = []
    npm_downloads = []
    
    for tool_data in tools.values():
        for snapshot in tool_data['snapshots']:
            community_metrics = snapshot.get('community_metrics', {})
            if community_metrics:
                if community_metrics.get('github_stars'):
                    github_stars.append((tool_data['tool_info']['name'], community_metrics['github_stars']))
                if community_metrics.get('reddit_mentions'):
                    reddit_mentions.append((tool_data['tool_info']['name'], community_metrics['reddit_mentions']))
                if community_metrics.get('npm_weekly_downloads'):
                    npm_downloads.append((tool_data['tool_info']['name'], community_metrics['npm_weekly_downloads']))
    
    if github_stars:
        top_github = sorted(github_stars, key=lambda x: x[1], reverse=True)[:5]
        print(f"   Top GitHub Stars:")
        for name, stars in top_github:
            print(f"      ⭐ {name}: {stars:,} stars")
    
    if reddit_mentions:
        top_reddit = sorted(reddit_mentions, key=lambda x: x[1], reverse=True)[:5]
        print(f"   Most Reddit Mentions:")
        for name, mentions in top_reddit:
            print(f"      💬 {name}: {mentions} mentions")
    
    if npm_downloads:
        top_npm = sorted(npm_downloads, key=lambda x: x[1], reverse=True)[:5]
        print(f"   Top NPM Downloads:")
        for name, downloads in top_npm:
            print(f"      📦 {name}: {downloads:,} weekly downloads")
    print()
    
    # Investigation recommendations
    print(f"🔎 INVESTIGATION RECOMMENDATIONS")
    print(f"   1. Focus on tools with high GitHub stars for technical adoption analysis")
    print(f"   2. Review Reddit sentiment for community perception insights")
    print(f"   3. Analyze news coverage for market positioning trends")
    print(f"   4. Compare package download metrics for ecosystem adoption")
    print(f"   5. Cross-reference ProductHunt voting with technical metrics")
    print()
    
    print(f"✨ Data analysis complete! Ready for deep investigation. ✨")

def main():
    parser = argparse.ArgumentParser(description="Analyze AI Intelligence Platform exports")
    parser.add_argument("--data-dir", default="./exports",
                       help="Directory containing exported data files")
    
    args = parser.parse_args()
    
    data_dir = Path(args.data_dir)
    analysis_file = data_dir / "intelligence_analysis.json"
    
    if not analysis_file.exists():
        print(f"❌ Analysis file not found: {analysis_file}")
        print(f"   Make sure you've run the export script first:")
        print(f"   python database/export_data.py --output-dir {args.data_dir}")
        return 1
    
    try:
        analyze_intelligence_data(analysis_file)
        return 0
    except Exception as e:
        print(f"❌ Analysis failed: {e}")
        return 1

if __name__ == "__main__":
    exit(main())