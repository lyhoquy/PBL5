from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from bs4 import BeautifulSoup
import time

def search_shopeefood_selenium(dish, city='hue'):
    query = dish.replace(' ', '%20')
    url = f"https://shopeefood.vn/{city}/danh-sach-dia-diem-giao-tan-noi?q={query}"

    # Cấu hình trình duyệt ẩn
    options = Options()
    options.add_argument("--headless")
    options.add_argument("--disable-gpu")
    options.add_argument("--window-size=1280x800")

    driver = webdriver.Chrome(options=options)
    driver.get(url)
    time.sleep(5)  # Đợi trang và JavaScript tải xong

    soup = BeautifulSoup(driver.page_source, 'html.parser')
    driver.quit()

    results = []
    cards = soup.select('.card-info')
    for card in cards:
        name_tag = card.select_one('.name-res')
        address_tag = card.select_one('.address-res')
        link_tag = card.select_one('a')

        if name_tag and address_tag and link_tag:
            results.append({
                'name': name_tag.get_text(strip=True),
                'address': address_tag.get_text(strip=True),
                'url': 'https://shopeefood.vn' + link_tag['href']
            })

    return results


# 👉 Test thử
if __name__ == '__main__':
    dish = "bún bò huế"
    city_slug = "hue"
    results = search_shopeefood_selenium(dish, city_slug)

    print("\n📍 Kết quả tìm thấy:")
    for i, res in enumerate(results, 1):
        print(f"{i}. {res['name']} - {res['address']}")
        print(f"   {res['url']}")
