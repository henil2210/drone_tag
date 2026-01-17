import os
from dotenv import load_dotenv
from urllib.parse import quote_plus
from configparser import ConfigParser


load_dotenv()

def config(filename="database.ini", section="postgresql"):
    parser = ConfigParser()
    parser.read(filename)

    db = {}
    if parser.has_section(section):
        params = parser.items(section)
        for param in params:
            db[param[0]] = param[1]
    else:
        raise Exception(f"Section {section} not found in the {filename} file.")
    return db


class Config:
    DB_USER = os.getenv('DB_USER', 'postgres')
    DB_PASSWORD = os.getenv('DB_PASSWORD', 'Harvi@57')
    DB_HOST = os.getenv('DB_HOST', 'localhost')
    DB_PORT = os.getenv('DB_PORT', '5432')
    DB_NAME = os.getenv('DB_NAME', 'Drone-Tag')  # Fixed correct DB name

    encoded_password = quote_plus(DB_PASSWORD)

    SQLALCHEMY_DATABASE_URI = 'postgresql://postgres:Abhyuday101@drone-tag.cl4k2w6ss4tt.ap-south-1.rds.amazonaws.com:5432/postgres'

    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECRET_KEY = os.urandom(24)
    

    AWS_API_ENDPOINT = os.getenv('AWS_API_ENDPOINT',
        'https://7mmfy9xgk9.execute-api.ap-south-1.amazonaws.com/json/data')
