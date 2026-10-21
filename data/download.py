import io
import os
import time
import zipfile
import requests

script_dir = os.path.dirname(os.path.abspath(__file__))
data_dir = os.path.join(script_dir, "raw")

base_url = "https://contratacionesabiertas.oece.gob.pe/api/v1/file/seace_v3/json/{year}/{month}"
headers = {"User-Agent": "Mozilla/5.0"}

years = ["2023", "2024", "2025"]
months = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"]

max_retries = 5
retry_delay = 10

def download_file(url, output_path):
    response = requests.get(url, headers=headers, timeout=60)
    response.raise_for_status()

    tmp_path = output_path + ".tmp"
    
    with zipfile.ZipFile(io.BytesIO(response.content)) as zf:
        json_name = next(n for n in zf.namelist() if n.endswith(".json"))
        with zf.open(json_name) as src, open(tmp_path, "wb") as dst:
            dst.write(src.read())
    
    os.replace(tmp_path, output_path)


def download_with_retries(url, output_path):
    for attempt in range(1, max_retries + 1):
        try:
            download_file(url, output_path)
            return
        except requests.exceptions.HTTPError:
            raise
        except (requests.exceptions.RequestException, zipfile.BadZipFile) as e:
            if attempt == max_retries:
                raise
            time.sleep(retry_delay)


def download_data():

    for year in years:

        os.makedirs(f"{data_dir}/{year}", exist_ok=True)

        for month in months:
            url = base_url.format(year=year, month=month)
            output_path = os.path.join(data_dir, year, f"{month}.json")

            if os.path.exists(output_path):
                continue

            try:
                download_with_retries(url, output_path)
            except:
                raise

if __name__ == "__main__":
    download_data()
