from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.edge.service import Service
import time
from random import randint

driver_path = "C:/BAR/edgedriver_win64/msedgedriver.exe"
service = Service(driver_path)
driver = webdriver.Edge(service=service)

"""
driver.get("ek-09:3002")

time.sleep(2);

drink_list = driver.find_element(By.ID, "drinkOptionList");

drinks = drink_list.find_elements(By.XPATH, "./*")

drinkButtons = [drink.find_elements(By.XPATH, "./*") for drink in drinks]
"""

formula_for_ev = lambda x: 10
t = 0


def execute(rand_nums):
    i = 0;

    for n in rand_nums:
        for _ in range(n):
            drinkButtons[i][0].click()
        i += 1

def run():
    global t
    random_num_by = [randint(10, formula_for_ev(t)) for _ in range(len(drinks))]
    #random_num_by = [20 for _ in range(len(drinks))]

    execute(random_num_by)

    t += 1

    time.sleep(30)

driver.get("http://192.168.1.200:3002")

time.sleep(2);

drink_list = driver.find_element(By.ID, "drinkOptionList");

drinks = drink_list.find_elements(By.XPATH, "./*")

drinkButtons = [drink.find_elements(By.XPATH, "./*") for drink in drinks]

for _ in range(200):
    try:
        driver.get("ek-09:3002")

        time.sleep(2);

        drink_list = driver.find_element(By.ID, "drinkOptionList");

        drinks = drink_list.find_elements(By.XPATH, "./*")

        drinkButtons = [drink.find_elements(By.XPATH, "./*") for drink in drinks]

        run()

        print(t)
    except:
        print("error ocurred")

print("end")
driver.quit();