#!/usr/bin/expect -f

set timeout 60
spawn npx drizzle-kit push --force

# Handle account table prompt
expect "Is account table created or renamed from another table?" {
    send "\r"
}

# Handle session table prompt
expect "Is session table created or renamed from another table?" {
    send "\r"
}

# Handle user table prompt
expect "Is user table created or renamed from another table?" {
    send "\r"
}

# Handle verification table prompt
expect "Is verification table created or renamed from another table?" {
    send "\r"
}

# Handle any other prompts
expect {
    "create table" { send "\r"; exp_continue }
    "rename table" { send "\r"; exp_continue }
    eof
}

wait