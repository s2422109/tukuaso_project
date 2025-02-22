import requests
from bs4 import BeautifulSoup
import google.generativeai as genai
import os

# Gemini APIの設定
GOOGLE_API_KEY = 'AIzaSyBWOujCNM9LpKmqPd-EZlPMGQLqyqwbqDs'
genai.configure(api_key=GOOGLE_API_KEY)

# Geminiモデルの設定
model = genai.GenerativeModel('gemini-pro')

def get_meteor_data():
    url = "https://www.ferry-sunflower.co.jp/lp/nightsky/2024/07.html"
    
    try:
        response = requests.get(url)
        response.encoding = 'utf-8'
        soup = BeautifulSoup(response.text, 'html.parser')
        txt_small_elements = soup.find_all('ul', class_='txt-small')
        
        meteor_data = []
        for element in txt_small_elements:
            meteor_data.append(element.text.strip())
        
        return "\n".join(meteor_data)
    except Exception as e:
        print(f"エラーが発生しました: {e}")
        return None

def analyze_with_gemini(meteor_data):
    prompt = """
    あなたは織姫のための彦星監視システムのアナリストです。
    以下の天文データを分析し、彦星（わし座のアルタイル/α星）の周辺を通過する流星群の影響から、
    彦星が浮気をしている可能性を評価してください。

    評価基準：
    1. 流星群の接近距離と強さ
    2. 流星群の活動期間の長さ
    3. 他の星々との接近状況
    4. 織姫星（こと座のベガ）との相対的な位置関係

    以下の形式で回答してください：
    1. 検出された関連流星群の詳細。それぞれの流星群ごとに近くないものについても全て記載。
    2. 各流星群による浮気リスク評価（理由も含めて）
    3. 総合的な浮気の可能性を0-100%で表示
    4. 織姫への注意アドバイス

    データ:
    {}
    """.format(meteor_data)

    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"Gemini APIエラー: {e}")
        return None

def main():
    # 流星群データの取得
    meteor_data = get_meteor_data()
    if meteor_data:
        # Geminiによる分析
        analysis = analyze_with_gemini(meteor_data)
        if analysis:
            print("=== アルタイル付近の流星群分析結果 ===")
            print(analysis)

if __name__ == "__main__":
    main()