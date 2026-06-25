import os
import time
from pynostr.event import Event
from pynostr.relay_manager import RelayManager
from pynostr.key import PrivateKey

NOSTR_PRIVATE_KEY = os.environ.get("NOSTR_PRIVATE_KEY", "nsec12345")
NOSTR_RELAYS = [
    "wss://relay.damus.io",
    "wss://nostr.easydns.ca",
    "wss://relay.snort.social",
    "wss://relay.primal.net",
    "wss://nos.lol",
    "wss://bitcoiner.social",
    "wss://nostr.wine",
    "wss://purplerelay.com",
    "wss://relay.nsecbunker.com",
    "wss://relay.nostr.net"
]

class NostrPoster:
    def __init__(self, privkey, relays):
        self.privkey = privkey
        self.relays = relays
        self.pk = PrivateKey.from_nsec(privkey)
        self.relay_manager = RelayManager()
        for relay in relays:
            self.relay_manager.add_relay(relay)
        time.sleep(1.25)

    def build_nostr_entry(self, entry):
        return entry.get('message', '')

    def post(self, entry):
        link = entry.get('link')
        if not link:
            print("[nostr.py] No link in entry, skipping.")
            return False
        
        try:
            out_str = self.build_nostr_entry(entry)
            print(f"[nostr.py] Signing event for {entry.get('title', '?')}...")
            event = Event(out_str)
            event.sign(self.pk.hex())
            print(f"[nostr.py] Publishing to {len(self.relays)} relays...")
            t0 = time.time()
            self.relay_manager.publish_event(event)
            self.relay_manager.run_sync()
            elapsed = time.time() - t0
            print(f"[nostr.py] Published OK ({elapsed:.1f}s)")
            return True
        except Exception as e:
            print(f"[nostr.py] Failed: {e}")
            return False

    def close(self):
        self.relay_manager.close_connections()

if __name__ == "__main__":
    import sys
    import json
    
    if len(sys.argv) > 1:
        entry = json.loads(sys.argv[1])
        poster = NostrPoster(NOSTR_PRIVATE_KEY, NOSTR_RELAYS)
        poster.post(entry)
        poster.close()
    else:
        print("Usage: python3 nostr.py '{\"title\":...,\"link\":...,\"author\":...}'")
