PORT = ENV.fetch('PORT', '3000')

API_TOKEN = ENV['API_TOKEN']
raise 'API_TOKEN is required' unless API_TOKEN

SECRET_KEY = ENV.fetch('SECRET_KEY') { raise 'SECRET_KEY is required' }
