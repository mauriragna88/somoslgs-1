'use client'

import { Player } from '@remotion/player'
import { LagosComposition, LAGOS_VIDEO_DURATION } from './LagosComposition'

export default function LagosVideoInner() {
  return (
    <div className="w-full rounded-2xl overflow-hidden shadow-2xl shadow-black/30">
      <Player
        component={LagosComposition}
        durationInFrames={LAGOS_VIDEO_DURATION}
        fps={30}
        compositionWidth={1280}
        compositionHeight={720}
        style={{ width: '100%' }}
        controls
        loop
        autoPlay
        clickToPlay
        showVolumeControls={false}
      />
    </div>
  )
}
