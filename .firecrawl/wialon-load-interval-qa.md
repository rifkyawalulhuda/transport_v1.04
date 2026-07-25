Parameters:
- `itemId`: unit or resource ID
- `timeFrom`: interval beginning
- `timeTo`: interval end
- `flags`: flags for loading messages
- `flagsMask`: mask
- `loadCount`: how many messages to return (0xffffffff - all found)

Response format:
```json
{
	"count":<uint>,				/* messages count */
	"messages":[				/* array of messages */\
		{\
			...\
		}\
	]
}
```

Flags:
- `0x0000`: all messages with data
- `0x0010`: messages with data, which contain alarm bit
- `0x2000`: video usage messages