import { useState, useMemo, useCallback } from 'react';
import { entropyToMnemonic } from 'bip39/bip39';
import { sha256 } from 'js-sha256';
import AudioWaveform, { RecordState } from '../../lib/audio-react-recorder/dist/index.modern';
import Container from './Container';
import Mnemonic from './Mnemonic';
import RecordButton from './RecordButton';
import CopyToClipboardButton from './CopyToClipboardButton';
import RerecordButton from './RerecordButton';
import { ValueOf } from '../utils/valueOf';

export default () => {
  const [recordingState, setRecordingState] = useState<ValueOf<typeof RecordState>>(RecordState.STOP);
  const [mnemonic, setMnemonic] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const startRecording = useCallback(() => {
    setMnemonic(null);
    setRecordingState(RecordState.START);
  }, []);

  const stopRecording = useCallback(() => {
    setRecordingState(RecordState.STOP);
  }, []);

  const onStopRecording = useCallback(async (audioData) => {
    setIsProcessing(true);
    const arrayBuffer = await audioData.blob.arrayBuffer();
    setIsProcessing(false);
    const entropyInput = new Int32Array(arrayBuffer).slice(20);
    const mnemonic = entropyToMnemonic(sha256(entropyInput));
    setMnemonic(mnemonic);
  }, []);

  const isRecording = useMemo(() => recordingState === RecordState.START, [recordingState]);

  return (
    <>
      <Container>
        <div className={isRecording ? 'visible' : 'hidden'}>
          <AudioWaveform
            state={recordingState}
            onStop={onStopRecording}
            canvasHeight={250}
            foregroundColor="#7237cc"
            backgroundColor="#fff"
          />
        </div>

        {!isRecording && !isProcessing && !mnemonic && (
          <p className="description">
            Generate a <strong>BIP39 mnemonic phrase</strong> from<br />an audio recording.
          </p>
        )}

        {!mnemonic && (
          <RecordButton
            isRecording={isRecording}
            isProcessing={isProcessing}
            start={startRecording}
            stop={stopRecording}
          />
        )}

        {mnemonic && (
          <>
            <Mnemonic phrase={mnemonic} />
            <CopyToClipboardButton text={mnemonic} />
          </>
        )}
      </Container>

      <div className="footer">
        {mnemonic && (
          <RerecordButton start={startRecording} />
        )}
      </div>
    </>
  );
}