#!/usr/bin/expect -f
# Script para deploy automático usando expect
# Execute: chmod +x deploy-com-expect.sh && ./deploy-com-expect.sh

set password "IAbots2025-@+"
set server "root@92.113.33.226"
set backend_path "/var/www/biacrm/api"

set timeout 30

# Comando 1: Enviar dist/*
puts "Enviando backend/dist/*..."
spawn scp -r backend/dist/* ${server}:${backend_path}/dist/
expect {
    "password:" {
        send "$password\r"
        exp_continue
    }
    eof
}

# Comando 2: Enviar package.json
puts "Enviando package.json..."
spawn scp backend/package.json ${server}:${backend_path}/
expect {
    "password:" {
        send "$password\r"
        exp_continue
    }
    eof
}

# Comando 3: Enviar package-lock.json
puts "Enviando package-lock.json..."
spawn scp backend/package-lock.json ${server}:${backend_path}/
expect {
    "password:" {
        send "$password\r"
        exp_continue
    }
    eof
}

puts "Deploy concluido!"



