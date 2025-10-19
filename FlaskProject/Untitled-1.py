@sock.route('/pub/chat')
def handler(sock):
    try:
        while True:
            message = sock.receive()
            try:
                jsonMsg = json.loads(message)
                if jsonMsg.get("cmd") == "sendlog":
                    try:
                        # Usar el bridge existente
                        get_attendance(jsonMsg, sock)
                    except Exception as err:
                        print(f"Error pushing to Supabase: {err}")
                        sock.send('{"ret":"sendlog","result":false,"reason":1}')