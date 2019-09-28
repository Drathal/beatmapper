import React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import styled from 'styled-components';

import { COLORS, UNIT } from '../../constants';
import * as actions from '../../actions';
import { createInfoContent } from '../../services/packaging.service';
import { getFile, saveInfoDat } from '../../services/file.service';
import useMount from '../../hooks/use-mount.hook';
import { sortDifficultyIds } from '../../helpers/song.helpers';
import { getSelectedSong } from '../../reducers/songs.reducer';
import { getIsPlaying } from '../../reducers/navigation.reducer';

import TextInput from '../TextInput';
import DropdownInput from '../DropdownInput';
import Heading from '../Heading';
import Spacer from '../Spacer';
import Spinner from '../Spinner';
import Button from '../Button';
import BeatmapSettings from './BeatmapSettings';

import CoverArtPicker from '../AddSongForm/CoverArtPicker';
import SongPicker from '../AddSongForm/SongPicker';

const SongDetails = ({
  song,
  isPlaying,
  pausePlaying,
  updateSongDetails,
  deleteBeatmap,
  updateBeatmapMetadata,
  history,
}) => {
  const [songData, setSongData] = React.useState(song);
  const setSongProperty = (key, value) => {
    setSongData({
      ...songData,
      [key]: value,
    });
  };

  const [status, setStatus] = React.useState('idle');

  const difficultyIds = sortDifficultyIds(
    Object.keys(songData.difficultiesById)
  );

  // When this component mounts, if the song is playing, pause it.
  useMount(() => {
    if (isPlaying) {
      pausePlaying();
    }

    getFile(song.songFilename).then(initialSongFile => {
      setSongProperty('songFile', initialSongFile);
    });
  });

  const handleSubmit = async ev => {
    if (!songData.name || !songData.artistName || !songData.bpm) {
      return;
    }

    ev.preventDefault();

    setStatus('working');

    // Update our redux state
    updateSongDetails(
      song.id,
      songData.name,
      songData.subName,
      songData.artistName,
      songData.mapAuthorName,
      songData.bpm,
      songData.offset,
      songData.swingAmount,
      songData.swingPeriod,
      songData.previewStartTime,
      songData.previewDuration,
      songData.environment,
      songData.difficultiesById
    );

    // Back up our latest data!
    await saveInfoDat(
      song.id,
      createInfoContent(songData, {
        version: 2,
      })
    );

    // The update happens immediately, but it's disconcerting with no
    // appearance of "loading". Fake a delay
    window.setTimeout(() => {
      setStatus('idle');
    }, Math.random() * 200 + 200);
  };

  const handleCopyBeatmap = (ev, id) => {
    ev.preventDefault();

    alert('Functionality coming soon!');
  };
  const handleDeleteBeatmap = (ev, id) => {
    ev.preventDefault();

    const confirmed = window.confirm(
      'Are you sure you want to do this? This action cannot be undone.'
    );

    if (!confirmed) {
      return;
    }

    // Delete our working state
    let mutableDifficultiesCopy = { ...songData.difficultiesById };
    delete mutableDifficultiesCopy[id];

    // Don't let the user delete the last difficulty!
    const remainingDifficultyIds = Object.keys(mutableDifficultiesCopy);
    if (remainingDifficultyIds.length === 0) {
      alert(
        'Sorry, you cannot delete the only remaining difficulty! Please create another difficulty first.'
      );
      return;
    }

    // If the user is currently editing the difficulty that they're trying to
    // delete, let's redirect them to the next difficulty.
    const nextDifficultyId = remainingDifficultyIds[0];

    setSongProperty('difficultiesById', mutableDifficultiesCopy);

    deleteBeatmap(song.id, id);

    history.push(`/edit/${song.id}/${nextDifficultyId}/details`);
  };

  const handleSaveBeatmap = (ev, difficulty) => {
    const { noteJumpSpeed, startBeatOffset } = songData.difficultiesById[
      difficulty
    ];
    updateBeatmapMetadata(
      song.id,
      difficulty,
      Number(noteJumpSpeed),
      Number(startBeatOffset)
    );
  };

  // TODO: I should probably add the SongPicker and CoverArtPicker components.
  // It's a bit more complicated since I need to allow them to be prepopulated,
  // which the components don't currently support

  return (
    <Wrapper>
      <InnerWrapper>
        <Spacer size={UNIT * 10} />
        <Heading size={1}>Edit Song Details</Heading>
        <Spacer size={UNIT * 6} />

        <form onSubmit={handleSubmit}>
          <Row>
            <SongPicker
              height={150}
              songFile={songData.songFile}
              setSongFile={file => setSongProperty('songFile', file)}
            />
            <Spacer size={UNIT * 4} />
          </Row>
          <Row>
            <Cell>
              <TextInput
                required
                label="Song name"
                value={songData.name}
                placeholder="Radar"
                onChange={ev => setSongProperty('name', ev.target.value)}
              />
            </Cell>
            <Spacer size={UNIT * 4} />
            <Cell>
              <TextInput
                label="Song sub-name"
                value={songData.subName}
                placeholder="Original Mix"
                onChange={ev => setSongProperty('subName', ev.target.value)}
              />
            </Cell>
          </Row>
          <Row>
            <Cell>
              <TextInput
                required
                label="Artist name"
                value={songData.artistName}
                placeholder="Fox Stevenson"
                onChange={ev => setSongProperty('artistName', ev.target.value)}
              />
            </Cell>
            <Spacer size={UNIT * 4} />
            <Cell>
              <TextInput
                required
                label="Map author name"
                value={songData.mapAuthorName}
                onChange={ev =>
                  setSongProperty('mapAuthorName', ev.target.value)
                }
              />
            </Cell>
          </Row>

          <Row>
            <Cell>
              <TextInput
                required
                type="number"
                label="BPM"
                value={songData.bpm}
                placeholder="140"
                onChange={ev => setSongProperty('bpm', Number(ev.target.value))}
              />
            </Cell>
            <Spacer size={UNIT * 4} />
            <Cell>
              <TextInput
                type="number"
                label="Offset"
                value={songData.offset}
                placeholder="0"
                onChange={ev =>
                  setSongProperty('offset', Number(ev.target.value))
                }
              />
            </Cell>
            <Spacer size={UNIT * 4} />

            <Cell>
              <TextInput
                label="Swing amount"
                value={songData.swingAmount}
                placeholder="0"
                onChange={ev =>
                  setSongProperty('swingAmount', Number(ev.target.value))
                }
              />
            </Cell>
            <Spacer size={UNIT * 4} />
            <Cell>
              <TextInput
                label="Swing period"
                value={songData.swingPeriod}
                placeholder="0"
                onChange={ev =>
                  setSongProperty('swingPeriod', Number(ev.target.value))
                }
              />
            </Cell>
          </Row>

          <Row>
            <Cell>
              <TextInput
                required
                type="number"
                label="Preview start time"
                value={songData.previewStartTime}
                placeholder="(in seconds)"
                onChange={ev =>
                  setSongProperty('previewStartTime', Number(ev.target.value))
                }
              />
            </Cell>
            <Spacer size={UNIT * 4} />
            <Cell>
              <TextInput
                required
                type="number"
                label="Preview duration"
                value={songData.previewDuration}
                placeholder="(in seconds)"
                onChange={ev =>
                  setSongProperty('previewDuration', Number(ev.target.value))
                }
              />
            </Cell>
            <Spacer size={UNIT * 4} />

            <Cell>
              <DropdownInput
                label="Environment"
                value={songData.environment}
                onChange={ev => setSongProperty('environment', ev.target.value)}
              >
                <option value="NiceEnvironment">NiceEnvironment</option>
                <option value="DefaultEnvironment">DefaultEnvironment</option>
                <option value="BigMirrorEnvironment">
                  BigMirrorEnvironment
                </option>
                <option value="TriangleEnvironment">TriangleEnvironment</option>
                <option value="DragonsEnvironment">DragonsEnvironment</option>
              </DropdownInput>
            </Cell>
          </Row>
          <Spacer size={UNIT * 2} />
          <Center>
            <Button
              disabled={status === 'working'}
              color={status === 'success' && COLORS.green[700]}
            >
              {status === 'working' ? (
                <Spinner size={16} />
              ) : status === 'success' ? (
                'Saved!'
              ) : (
                'Update song details'
              )}
            </Button>
          </Center>
        </form>
        <Spacer size={UNIT * 8} />

        <Heading size={1}>Edit Beatmaps</Heading>
        <Spacer size={UNIT * 6} />
        <Row>
          {difficultyIds.map(id => {
            const {
              noteJumpSpeed,
              startBeatOffset,
            } = songData.difficultiesById[id];
            const savedVersion = song.difficultiesById[id];

            return (
              <BeatmapSettings
                id={id}
                key={id}
                dirty={
                  noteJumpSpeed !== savedVersion.noteJumpSpeed ||
                  startBeatOffset !== savedVersion.startBeatOffset
                }
                noteJumpSpeed={noteJumpSpeed}
                startBeatOffset={startBeatOffset}
                handleChangeNoteJumpSpeed={noteJumpSpeed => {
                  setSongProperty('difficultiesById', {
                    ...songData.difficultiesById,
                    [id]: {
                      ...songData.difficultiesById[id],
                      noteJumpSpeed,
                    },
                  });
                }}
                handleChangeStartBeatOffset={startBeatOffset => {
                  setSongProperty('difficultiesById', {
                    ...songData.difficultiesById,
                    [id]: {
                      ...songData.difficultiesById[id],
                      startBeatOffset,
                    },
                  });
                }}
                handleCopyBeatmap={handleCopyBeatmap}
                handleDeleteBeatmap={handleDeleteBeatmap}
                handleSaveBeatmap={handleSaveBeatmap}
              />
            );
          })}
        </Row>
        <Spacer size={UNIT * 10} />
      </InnerWrapper>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  max-height: 100vh;
  overflow: auto;
`;

const InnerWrapper = styled.div`
  padding-left: ${UNIT * 4}px;
  padding-right: ${UNIT * 4}px;
  max-width: 700px;
  margin: auto;
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: ${UNIT * 4}px;
`;

const Cell = styled.div`
  flex: 1;
`;

const Center = styled.div`
  display: flex;
  justify-content: center;
`;

const mapStateToProps = state => {
  return {
    song: getSelectedSong(state),
    isPlaying: getIsPlaying(state),
  };
};

const mapDispatchToProps = {
  updateSongDetails: actions.updateSongDetails,
  deleteBeatmap: actions.deleteBeatmap,
  updateBeatmapMetadata: actions.updateBeatmapMetadata,
  pausePlaying: actions.pausePlaying,
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withRouter(SongDetails));
