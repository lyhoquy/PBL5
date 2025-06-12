esp_status = {
    "status": "startup",  # startup | recognizing | recipe | travel
    "dish": "",
    "region": ""
}

def update_status(status=None, dish=None, region=None):
    if status:
        esp_status["status"] = status
    if dish is not None:
        esp_status["dish"] = dish
    if region is not None:
        esp_status["region"] = region

def get_status():
    return esp_status
