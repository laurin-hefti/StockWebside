from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
import time
from random import randint

driver_path = "C:/Users/l.hefti/Downloads/edgedriver_win64/msedgedriver.exe"
driver = webdriver.Edge(driver_path)

"""
driver.get("http://localhost:3002")

time.sleep(2);

drink_list = driver.find_element(By.ID, "drinkOptionList");

drinks = drink_list.find_elements(By.XPATH, "./*")

drinkButtons = [drink.find_elements(By.XPATH, "./*") for drink in drinks]
"""

formula_for_ev = lambda x: 30
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

    time.sleep(20)


for _ in range(200):
    try:
        driver.get("http://localhost:3002")

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