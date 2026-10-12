// 给 ACEBOTTteam/AcebottKit 添加 WS2812、IIC 四位数码管、串口 MP3 和紫外线采集积木。
// 使用 micro:bit core 的 WS2812 发送接口，无需另加灯带依赖。
//% groups='["LED Modules","LED Matrix Modules","RGB LED Modules","4-Digit Tube IIC Modules","LCD1602 Modules","Laser Modules","OLED12864-1.3inch Modules","WS2812 Modules","4-Digit Tube Modules"]'
namespace Acebott {
    export enum MP3TxPin {
        //% block="P0（TX）"
        P0 = 0,
        //% block="P1"
        P1 = 1,
        //% block="P2"
        P2 = 2,
        //% block="P8"
        P8 = 8,
        //% block="P12"
        P12 = 12,
        //% block="P13(SCK)"
        P13 = 13,
        //% block="P14(MISO)"
        P14 = 14,
        //% block="P15(MOSI)"
        P15 = 15,
        //% block="P16"
        P16 = 16
    }

    export enum MP3RxPin {
        //% block="P0"
        P0 = 0,
        //% block="P1（RX）"
        P1 = 1,
        //% block="P2"
        P2 = 2,
        //% block="P8"
        P8 = 8,
        //% block="P12"
        P12 = 12,
        //% block="P13(SCK)"
        P13 = 13,
        //% block="P14(MISO)"
        P14 = 14,
        //% block="P15(MOSI)"
        P15 = 15,
        //% block="P16"
        P16 = 16
    }

    //% blockId=acebott_mp3_tx_pin block="%pin"
    //% blockHidden=true shim=TD_ID
    //% pin.defl=Acebott.MP3TxPin.P0
    export function _MP3TxPin(pin: MP3TxPin): number {
        return pin
    }

    //% blockId=acebott_mp3_rx_pin block="%pin"
    //% blockHidden=true shim=TD_ID
    //% pin.defl=Acebott.MP3RxPin.P1
    export function _MP3RxPin(pin: MP3RxPin): number {
        return pin
    }

    export enum MP3Action {
        //% block="Resume playback"
        Play = 0x11,
        //% block="Pause playback"
        Pause = 0x12,
        //% block="Next track"
        Next = 0x13,
        //% block="Previous track"
        Previous = 0x14
    }

    function extraClamp(value: number, min: number, max: number): number {
        return Math.max(min, Math.min(max, Math.round(value)))
    }

    // WS2812：GRB 顺序，800 kHz；每个引脚分别保存灯珠颜色。
    let extraStrips: Buffer[] = []
    // 未调用数量设置积木时，每个引脚默认使用 30 颗灯珠。
    const extraStripDefaultCount = 30

    function extraSendStrip(pin: DigitalWritePin, buffer: Buffer): void {
        light.sendWS2812Buffer(buffer, 100 + pin)
        control.waitMicros(300)
    }

    function extraGetStrip(pin: DigitalWritePin): Buffer {
        if (!extraStrips[pin]) extraStrips[pin] = pins.createBuffer(extraStripDefaultCount * 3)
        return extraStrips[pin]
    }

    /** Set the LED count for this pin and turn off the strip. Later calls keep this count; the default is 30. */
    //% blockId=acebott_ws2812_init block="WS2812 strip pin %pin|initial count %count"
    //% subcategory="Display" group="WS2812 Modules" weight=90
    //% inlineInputMode=inline
    //% pin.defl=DigitalWritePin.P0 count.defl=30 count.min=1 count.max=300
    export function WS2812_Init(pin: DigitalWritePin, count: number): void {
        count = extraClamp(count, 1, 300)
        let previous = extraStrips[pin]
        if (previous) {
            previous.fill(0)
            extraSendStrip(pin, previous)
        }
        extraStrips[pin] = pins.createBuffer(count * 3)
        extraSendStrip(pin, extraStrips[pin])
    }

    /** Set the strip color. LED 0 selects all LEDs, using a default count of 30. Out-of-range LED numbers are ignored; black turns LEDs off. */
    //% blockId=acebott_ws2812_color block="WS2812 strip pin %pin|LED %position|color %color"
    //% subcategory="Display" group="WS2812 Modules" weight=89
    //% inlineInputMode=inline
    //% pin.defl=DigitalWritePin.P0 position.defl=0 position.min=0 position.max=300
    //% color.shadow="colorNumberPicker" color.defl=0xff0000
    export function WS2812_Color(pin: DigitalWritePin, position: number, color: number): void {
        WS2812_RGB(pin, position, (color >> 16) & 0xff, (color >> 8) & 0xff, color & 0xff)
    }

    /** Set the strip RGB color using the configured count, defaulting to 30. LED 0 selects all LEDs; 1, 2, 3 and so on select individual LEDs and preserve the other colors. RGB values of 0 turn LEDs off. */
    //% blockId=acebott_ws2812_rgb block="WS2812 strip pin %pin|LED %position|R %r|G %g|B %b"
    //% subcategory="Display" group="WS2812 Modules" weight=88
    //% inlineInputMode=inline
    //% pin.defl=DigitalWritePin.P0 position.defl=0 position.min=0 position.max=300
    //% r.defl=255 r.min=0 r.max=255 g.defl=0 g.min=0 g.max=255 b.defl=0 b.min=0 b.max=255
    export function WS2812_RGB(pin: DigitalWritePin, position: number, r: number, g: number, b: number): void {
        position = Math.round(position)
        if (position < 0 || position > 300) return
        let buffer = extraGetStrip(pin)
        let count = Math.idiv(buffer.length, 3)
        if (position > count) return
        r = extraClamp(r, 0, 255)
        g = extraClamp(g, 0, 255)
        b = extraClamp(b, 0, 255)
        let start = position == 0 ? 0 : position - 1
        let end = position == 0 ? count : position
        for (let i = start; i < end; i++) {
            buffer[i * 3] = g
            buffer[i * 3 + 1] = r
            buffer[i * 3 + 2] = b
        }
        extraSendStrip(pin, buffer)
    }

    // TM1650 硬件 IIC：控制地址 0x24，四位显示地址 0x34～0x37。
    // micro:bit 默认 SDA=P20、SCL=P19；这里使用 7 位地址。
    let extraTubeDigits = pins.createBuffer(4)
    let extraTubeControl = 0x21
    let extraTubeInitialized = false
    const extraTubeNumbers = [0x3f, 0x06, 0x5b, 0x4f, 0x66, 0x6d, 0x7d, 0x07, 0x7f, 0x6f]

    function extraTubeWriteControl(): void {
        pins.i2cWriteNumber(0x24, extraTubeControl, NumberFormat.UInt8BE)
        extraTubeInitialized = true
    }

    function extraTubeWriteDigits(): void {
        if (!extraTubeInitialized) extraTubeWriteControl()
        for (let i = 0; i < 4; i++) {
            pins.i2cWriteNumber(0x34 + i, extraTubeDigits[i], NumberFormat.UInt8BE)
        }
    }

    function extraTubeCharacter(c: string): number {
        let digit = c.charCodeAt(0) - 48
        if (digit >= 0 && digit <= 9) return extraTubeNumbers[digit]
        switch (c) {
            case "A": case "a": return 0x77
            case "B": case "b": return 0x7c
            case "C": return 0x39
            case "c": return 0x58
            case "D": case "d": return 0x5e
            case "E": case "e": return 0x79
            case "F": case "f": return 0x71
            case "G": return 0x3d
            case "H": return 0x76
            case "h": return 0x74
            case "J": return 0x1e
            case "L": case "l": return 0x38
            case "N": return 0x37
            case "n": return 0x54
            case "O": case "o": return 0x5c
            case "P": case "p": return 0x73
            case "Q": case "q": return 0x67
            case "R": case "r": return 0x50
            case "U": return 0x3e
            case "u": return 0x1c
            case "Y": case "y": return 0x6e
            case "I": case "i": return 0x06 // 七段数码管用两段竖线表示 I/i。
            case "-": return 0x40
            default: return 0
        }
    }

    /** Initialize the IIC display with brightness from 0 to 7, defaulting to 2. */
    //% blockId=acebott_tube4_init block="4-digit tube IIC initialize|brightness %brightness"
    //% blockHidden=true
    //% subcategory="Display" group="4-Digit Tube IIC Modules" weight=80
    //% brightness.defl=2 brightness.min=0 brightness.max=7
    export function Tube4_Init(brightness: number): void {
        extraTubeControl = (extraClamp(brightness, 0, 7) << 4) | 1
        extraTubeWriteControl()
        Tube4_Clear()
    }

    /** Show up to four characters, right aligned. A decimal point attaches to the previous character. Longer strings display ----. */
    //% blockId=acebott_tube4_string block="4-digit tube IIC show string %text"
    //% subcategory="Display" group="4-Digit Tube IIC Modules" weight=79
    //% text.defl="Hi"
    export function Tube4_ShowString(text: string): void {
        let digits = [0, 0, 0, 0]
        let used = 0
        for (let i = 0; i < text.length; i++) {
            let c = text.charAt(i)
            if (c == ".") {
                if (used == 0) {
                    digits[0] = 0x80
                    used = 1
                } else {
                    digits[used - 1] |= 0x80
                }
            } else {
                if (used >= 4) {
                    extraTubeDigits.fill(0x40)
                    extraTubeWriteDigits()
                    return
                }
                digits[used] = extraTubeCharacter(c)
                used++
            }
        }
        extraTubeDigits.fill(0)
        for (let i = 0; i < used; i++) extraTubeDigits[4 - used + i] = digits[i]
        extraTubeWriteDigits()
    }

    /** Show an integer or decimal number, initializing automatically on first use. Decimals are rounded to fit four display positions. Values outside -999 to 9999 display ----. */
    //% blockId=acebott_tube4_number block="4-digit tube IIC show number %value"
    //% subcategory="Display" group="4-Digit Tube IIC Modules" weight=78
    //% value.defl=100 value.shadow=math_number
    export function Tube4_ShowNumber(value: number): void {
        if (value < -999 || value > 9999) {
            Tube4_ShowString("----")
            return
        }
        let scale = 1000
        for (let decimals = 3; decimals >= 0; decimals--) {
            let text = (Math.round(value * scale) / scale).toString()
            let width = 0
            for (let i = 0; i < text.length; i++) {
                if (text.charAt(i) != ".") width++
            }
            if (width <= 4) {
                Tube4_ShowString(text)
                return
            }
            scale = Math.idiv(scale, 10)
        }
        Tube4_ShowString("----")
    }

    //% blockId=acebott_tube4_brightness block="4-digit tube IIC set brightness %brightness"
    //% blockHidden=true
    //% subcategory="Display" group="4-Digit Tube IIC Modules" weight=77
    //% brightness.defl=2 brightness.min=0 brightness.max=7
    export function Tube4_Brightness(brightness: number): void {
        extraTubeControl = (extraTubeControl & 0x0f) | (extraClamp(brightness, 0, 7) << 4)
        extraTubeWriteControl()
    }

    //% blockId=acebott_tube4_clear block="4-digit tube IIC clear"
    //% blockHidden=true
    //% subcategory="Display" group="4-Digit Tube IIC Modules" weight=76
    export function Tube4_Clear(): void {
        extraTubeDigits.fill(0)
        extraTubeWriteDigits()
    }

    /** Set a decimal point immediately. Digit positions 1 to 4 run from left to right. */
    //% blockId=acebott_tube4_dot block="4-digit tube IIC digit %position decimal point %state"
    //% blockHidden=true
    //% subcategory="Display" group="4-Digit Tube IIC Modules" weight=75
    //% position.defl=2 position.min=1 position.max=4 state.defl=SwitchStatus.ON
    export function Tube4_Dot(position: number, state: SwitchStatus): void {
        position = Math.round(position)
        if (position < 1 || position > 4) return
        if (state == SwitchStatus.ON) extraTubeDigits[position - 1] |= 0x80
        else extraTubeDigits[position - 1] &= 0x7f
        extraTubeWriteDigits()
    }

    //% blockId=acebott_tube4_display block="4-digit tube IIC display %state"
    //% blockHidden=true
    //% subcategory="Display" group="4-Digit Tube IIC Modules" weight=74
    //% state.defl=SwitchStatus.ON
    export function Tube4_Display(state: SwitchStatus): void {
        extraTubeControl = (extraTubeControl & 0xfe) | (state == SwitchStatus.ON ? 1 : 0)
        extraTubeWriteControl()
    }

    // MP3 沿用 ACB_MP3.cpp：7E、长度、命令、数据、XOR 校验、EF。
    function extraMP3Send(command: number, data: number[]): void {
        let length = data.length + 3
        let packet = pins.createBuffer(length + 2)
        packet[0] = 0x7e
        packet[1] = length
        packet[2] = command
        let checksum = length ^ command
        for (let i = 0; i < data.length; i++) {
            packet[3 + i] = data[i]
            checksum ^= data[i]
        }
        packet[3 + data.length] = checksum
        packet[4 + data.length] = 0xef
        serial.writeBuffer(packet)
        basic.pause(100)
    }

    /** TX and RX are micro:bit pins. Connect TX to the module RX, and RX to the module TX. */
    //% blockId=acebott_mp3_init block="MP3 initialize|TX pin %tx|RX pin %rx"
    //% subcategory="Executive" group="MP3 Modules" weight=70
    //% tx.shadow=acebott_mp3_tx_pin rx.shadow=acebott_mp3_rx_pin
    //% tx.defl=Acebott.MP3TxPin.P0 rx.defl=Acebott.MP3RxPin.P1
    export function MP3_Init(tx: number, rx: number): void {
        serial.redirect((100 + tx) as SerialPin, (100 + rx) as SerialPin, BaudRate.BaudRate9600)
        basic.pause(1000)
    }

    //% blockId=acebott_mp3_control block="MP3 %action"
    //% subcategory="Executive" group="MP3 Modules" weight=69
    //% action.defl=Acebott.MP3Action.Play
    export function MP3_Control(action: MP3Action): void {
        extraMP3Send(action, [])
    }

    //% blockId=acebott_mp3_volume block="MP3 set volume %volume"
    //% subcategory="Executive" group="MP3 Modules" weight=68
    //% volume.defl=20 volume.min=0 volume.max=30
    export function MP3_Volume(volume: number): void {
        extraMP3Send(0x31, [extraClamp(volume, 0, 30)])
    }

    /** Send command 0x41 with a 16-bit track number, matching playInFolder(M) in the reference library. */
    //% blockId=acebott_mp3_track block="MP3 play track %track"
    //% subcategory="Executive" group="MP3 Modules" weight=67
    //% track.defl=1 track.min=1 track.max=65535
    export function MP3_PlayTrack(track: number): void {
        track = extraClamp(track, 1, 65535)
        extraMP3Send(0x41, [(track >> 8) & 0xff, track & 0xff])
    }

    /** Read the raw analog value from the Ultraviolet V3 sensor, matching ACB_Ultraviolet.read("analogValue"). micro:bit returns 0 to 1023. */
    //% blockId=acebott_uv_analog block="Ultraviolet V3 sensor pin %pin|get analog value"
    //% subcategory="Sensor" group="Ultraviolet Sensor" weight=70
    //% inlineInputMode=inline pin.defl=AnalogReadPin.P0
    export function Ultraviolet_Read(pin: AnalogReadPin): number {
        return pins.analogReadPin((100 + pin) as AnalogPin)
    }

    /** Read a level from 0 to 11, matching ACB_Ultraviolet.read("level"). Scale the micro:bit ADC range of 0 to 1023 to the reference range of 0 to 4095. */
    //% blockId=acebott_uv_level block="Ultraviolet V3 sensor pin %pin|get level"
    //% subcategory="Sensor" group="Ultraviolet Sensor" weight=69
    //% inlineInputMode=inline pin.defl=AnalogReadPin.P0
    export function Ultraviolet_Level(pin: AnalogReadPin): number {
        let value = Ultraviolet_Read(pin)
        if (value >= 1023) return 11
        return Math.idiv(value * 4095, 1023 * 372)
    }
}
