import threading
import time
from datetime import datetime

# 1. CORRECCIÓN DE IMPORTACIÓN:
# Ya no se importa 'app' desde aquí para evitar la importación circular.
from database import db
from Models.Device import Device, get_device_by_serial_num
from Models.MachineCommand import (MachineCommand, find_pending_command,
                                   update_command_status,
                                   update_machine_command,
                                   update_machine_command_o)
from web_socket.WebSocketPool import WebSocketPool, ws_device


class SendOrderJob(threading.Thread):

    # 2. CORRECCIÓN DEL CONSTRUCTOR:
    # Acepta 'app' como argumento para "inyectar" la dependencia.
    def __init__(self, app):
        threading.Thread.__init__(self)
        self.stop_event = threading.Event()
        self.wd_list = {}
        self._thread = None
        self.app = app  # Almacena la instancia de la app de Flask

    def run_job(self):
        print("SendOrderJob start running")
        while not self.stop_event.is_set():
            # Hacemos una copia para evitar problemas de concurrencia si la lista cambia
            current_wd_list = list(self.wd_list.items())
            for key, device_status in current_wd_list:
                
                # 3. CORRECCIÓN DE CONTEXTO:
                # Usa 'self.app' para acceder al contexto de la aplicación.
                with self.app.app_context():
                    try:
                        print(f"Processing device: {key}")
                        in_sending = find_pending_command(0, key)

                        if in_sending:
                            pending_command = find_pending_command(1, key)
                            if not pending_command:
                                print("No pending command found, sending new command.")
                                if isinstance(device_status, dict):
                                    websock = device_status.get("websocket")
                                else:
                                    websock = device_status.websocket
                                
                                if websock:
                                    websock.send(in_sending[0].content)
                                    print("Command sent.")
                                    now = datetime.fromtimestamp(time.time())
                                    update_command_status(0, 1, now, in_sending[0].id)

                            elif len(pending_command) == 1:
                                run_time = pending_command[0].run_time
                                now = datetime.fromtimestamp(time.time())
                                difference = (now - run_time).total_seconds()
                                print(f"Time difference for pending command: {difference}s")

                                if difference > 20:  # Timeout de 20 segundos
                                    machine_command = pending_command[0]
                                    if machine_command.err_count < 3:
                                        print("Resending command due to timeout.")
                                        machine_command.err_count += 1
                                        machine_command.run_time = now
                                        update_machine_command_o(machine_command)
                                        
                                        device = get_device_by_serial_num(machine_command.serial)
                                        if device and device.status != 0:
                                            if isinstance(device_status, dict):
                                                websock = device_status.get("websocket")
                                            else:
                                                websock = device_status.websocket
                                            
                                            if websock:
                                                websock.send(machine_command.content)
                                    else:
                                        print("Command failed after 3 retries.")
                                        machine_command.err_count += 1 # Marcar como fallido final
                                        update_machine_command_o(machine_command)
                    except Exception as e:
                        import traceback
                        traceback.print_exc()
                        print(f"Error in SendOrderJob: {e}")

            time.sleep(1)  # Evita el uso intensivo de la CPU

    def stop(self):
        self.stop_event.set()

    def start_thread(self):
        if self._thread is None or not self._thread.is_alive():
            print("SendOrderJob: Starting background thread.")
            self.wd_list = ws_device
            self._thread = threading.Thread(target=self.run_job)
            self._thread.daemon = True # El hilo se detendrá cuando el programa principal termine
            self._thread.start()

    def is_running(self):
        return self._thread is not None and self._thread.is_alive()

    def stop_thread(self):
        print("SendOrderJob: Stopping background thread.")
        self.stop()
