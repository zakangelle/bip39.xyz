import { useState, useMemo, useCallback } from 'react';
import { entropyToMnemonic } from 'bip39/bip39';
import { sha256 } from 'js-sha256';
import { useSpring, animated } from 'react-spring';
import AudioRecorder, { RecordState } from '../../lib/audio-react-recorder/dist/index.modern';
import Container from './Container';
import Mnemonic from './Mnemonic';
import ActionButton from './ActionButton';
import RerecordButton from './RerecordButton';
import MicrophoneError from './MicrophoneError';
import Footer from './Footer';
import renderAnimation from '../constants/renderAnimation';
import { ValueOf } from '../utils/valueOf';

export default () => {
  const [isMicrophoneAccessGranted, setIsMicrophoneAccessGranted] = useState(false);
  const [hasMicrophoneError, setHasMicrophoneError] = useState(false);
  const [recordingState, setRecordingState] = useState<ValueOf<typeof RecordState>>(RecordState.STOP);
  const [mnemonic, setMnemonic] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const startRecording = useCallback(() => {
    setMnemonic('');
    setRecordingState(RecordState.START);
  }, []);

  const stopRecording = useCallback(() => {
    setRecordingState(RecordState.STOP);
  }, []);

  const onStopRecording = useCallback(async (recording) => {
    setIsProcessing(true);
    const audioData = await recording.blob.arrayBuffer();
    const entropyInput = new Int32Array(audioData).slice(20);
    const mnemonic = entropyToMnemonic(sha256(entropyInput));
    setMnemonic(mnemonic);
    setIsProcessing(false);
  }, []);

  const isRecording = useMemo(() =>
    isMicrophoneAccessGranted && recordingState === RecordState.START,
    [isMicrophoneAccessGranted, recordingState]
  );

  const isInInitialState = useMemo(() =>
    !isRecording && !isProcessing && !mnemonic && !hasMicrophoneError,
    [isRecording, isProcessing, mnemonic, hasMicrophoneError]
  );

  const animationProps = useSpring(renderAnimation);

  return (
    <animated.div style={animationProps}>
      <Container>
        <div className={isRecording && !mnemonic ? 'visible' : 'hidden'}>
          <AudioRecorder
            state={recordingState}
            onMicrophoneAccessGranted={() => setIsMicrophoneAccessGranted(true)}
            onStop={onStopRecording}
            onError={() => setHasMicrophoneError(true)}
            canvasHeight={200}
            foregroundColor="#ff34f9"
            backgroundColor="#1b153f"
          />
        </div>

        {isInInitialState && (
          <p className="description">
            Generate a <strong>BIP39 mnemonic phrase</strong><br />from an audio recording.
          </p>
        )}

        {hasMicrophoneError && (
          <MicrophoneError />
        )}

        <Mnemonic phrase={mnemonic} />

        <ActionButton
          isRecording={isRecording}
          isProcessing={isProcessing}
          start={startRecording}
          stop={stopRecording}
          mnemonic={mnemonic}
        />
      </Container>

      <Footer>
        {mnemonic && (
          <RerecordButton start={startRecording} />
        )}
      </Footer>
    </animated.div>
  );
}
