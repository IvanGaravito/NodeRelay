module.exports = {
    logLevel: 0xF7            //Log level. Value 0 means disable logging. Flags:
                                //	Info			0x01
                                //	Error			0x02
                                //	Debug			0x04
                                //	Connections		0x10
                                //	DataEvents		0x20
                                //	IncomingData	0x40
                                //	OutcomingData	0x80
    , listenRetryTimeout: 500 //Wait retryTimeout milliseconds before retry listening
    , listenRetryTimes: 1     //Retry retryTimes times when trying to listen
    , connRetryTimeout: 1000  //Wait retryTimeout milliseconds before retry connection
    , connRetryTimes: 2       //Retry retryTimes times
    , localHost: '127.0.0.1'  //IP for listening to connections
    , pool: {/*               //Here you define the list of tunnels to create
        <listen_at_port>: {
            dstHost: '<to_host>'
          , dstPort: <to_port>
          , srcHost: '<from_host>'
          , srcPort: <from_port>
        }
    */}
}