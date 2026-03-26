'use client'

import { Player } from '@remotion/player'
import { HomeComposition, HOME_VIDEO_DURATION } from './HomeComposition'

export default function HomeVideoInner() {
  return (
    <div className="w-full rounded-2xl overflow-hidden shadow-2xl shadow-black/20">
      <Player
        component={HomeComposition}
        durationInFrames={HOME_VIDEO_DURATION}
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
