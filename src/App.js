import React, {Component, PropTypes} from 'react';
import { sortBy } from 'lodash';
import classNames from 'classnames';
import './App.css';

const DEFAULT_QUERY = 'redux';
const DEFAULT_PAGE = 0;
const DEFAULT_HPP = '100';

const PATH_BASE = 'https://hn.algolia.com/api/v1';
const PATH_SEARCH = '/search';
const PARAM_SEARCH = 'query=';
const PARAM_PAGE = 'page=';
const PARAM_HPP = 'hitsPerPage=';

const SORTS = {
  NONE: list => list,
  TITLE: list => sortBy(list, 'title'),
  AUTHOR: list => sortBy(list, 'author'),
  COMMENTS: list => sortBy(list, 'num_comments').reverse(),
  POINTS: list => sortBy(list, 'points').reverse(),

};

const updateSearchTopstoriesState = (hits, page) => (prevState) => {

      const {searchKey, results} = prevState;

      const oldHits = results && results[searchKey]
          ? results[searchKey].hits
          : [];

      const updatedHits = [
          ...oldHits,
          ...hits
      ];

      return {
          results: {
              ...results,
              [searchKey]: {
                  hits: updatedHits,
                  page
              }
          },
          isLoading: false
      };

}

class App extends Component {

    constructor(props) {
        super(props);

        this.state = {
            results: null,
            searchKey: '',
            searchTerm: DEFAULT_QUERY,
            isLoading: false,
        };

        this.needsToSearchTopstories = this.needsToSearchTopstories.bind(this);
        this.setSearchTopstories = this.setSearchTopstories.bind(this);
        this.fetchSearchTopstories = this.fetchSearchTopstories.bind(this);
        this.onDismiss = this.onDismiss.bind(this);
        this.onSearchChange = this.onSearchChange.bind(this);
        this.onSearchSubmit = this.onSearchSubmit.bind(this);
    }


    needsToSearchTopstories(searchTerm) {
        return !this.state.results[searchTerm];
    }

    setSearchTopstories(result) {

        const {hits, page} = result;

        this.setState(updateSearchTopstoriesState(hits, page));






    }

    fetchSearchTopstories(searchTerm, page) {

        this.setState({ isLoading: true });
        const url = `${PATH_BASE}${PATH_SEARCH}?${PARAM_SEARCH}${searchTerm}&${PARAM_PAGE}${page}&${PARAM_HPP}${DEFAULT_HPP}`;

        fetch(url).then((response) => {
            if (response.ok) {
                return response.json();
            }
            throw new Error('Network response was not ok.');
        }).then(result => this.setSearchTopstories(result)).catch(error => console.log('Network error', error));
    }

    componentDidMount() {
        const {searchTerm} = this.state;
        this.setState({searchKey: searchTerm});
        this.fetchSearchTopstories(searchTerm, DEFAULT_PAGE);
    }

    onDismiss(id) {

        const {searchKey, results} = this.state;
        const {hits, page} = results[searchKey];

        const isNotId = item => item.objectID !== id;
        const updatedHits = hits.filter(isNotId);

        this.setState({
            results: {
                ...results,
                [searchKey]: {
                    hits: updatedHits,
                    page
                }
            }
        });
    }

    onSearchChange(event) {
        this.setState({searchTerm: event.target.value});
    }

    onSearchSubmit(event) {
        const {searchTerm} = this.state;
        this.setState({searchKey: searchTerm});

        if (this.needsToSearchTopstories(searchTerm)) {
            this.fetchSearchTopstories(searchTerm, DEFAULT_PAGE);
        }

        //to stop browser native behavior of reloading on form submit
        event.preventDefault();
    }

    render() {

        const { searchTerm, results, searchKey, isLoading } = this.state;
        const page = (results && results[searchKey] && results[searchKey].page) || 0;
        const list = (results && results[searchKey] && results[searchKey].hits) || [];

        return (
            <div className="page">
                <div className="interactions">
                    <Search value={searchTerm} onChange={this.onSearchChange} onSubmit={this.onSearchSubmit}>
                        Search
                    </Search>
                </div>

                <Table
                  list={list}
                  onDismiss={this.onDismiss}/>

                <div className="interactions">
                  <ButtonWithLoading
                    isLoading={isLoading}
                    onClick={() => this.fetchSearchTopstories(searchKey, page + 1)}>
                        More
                    </ButtonWithLoading>
                </div>
            </div>
        );
    }
}

class Search extends Component {

    componentDidMount() {
      this.input.focus();
    }

  render(){

    const {value, onChange, onSubmit, children} = this.props;

    return (
      <form onSubmit={onSubmit}>
        <input
          type="text"
          value={value}
          onChange={onChange}
        ref={(node) => {this.input = node; }}/>
        <button type="submit">
            {children}
        </button>
      </form>
    );
  }

}

Search.propTypes = {
    value: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired,
    children: PropTypes.node.isRequired,
  };

class Table extends Component{

  constructor(props){
    super(props);

    this.state = {
      sortKey: 'NONE',
      isSortReverse: false,
    };

    this.onSort = this.onSort.bind(this);
  }

  onSort(sortKey) {
    const isSortReverse = this.state.sortKey === sortKey && !this.state.isSortReverse;
    this.setState({ sortKey, isSortReverse });
  }

  render() {

    const {
      list,
      onDismiss
    } = this.props;

    const {
      sortKey,
      isSortReverse,
    } = this.state;

    const sortedList = SORTS[sortKey](list);
    const reverseSortedList = isSortReverse
      ? sortedList.reverse()
      : sortedList;

    return (
      <div className="table">
        <div className="table-header">
          <span style={{ width: '40%' }}>
            <Sort
              sortKey={'TITLE'}
              onSort={this.onSort}
              activeSortKey={sortKey}>
              Title
            </Sort>
          </span>
          <span style={{ width: '30%' }}>
            <Sort
              sortKey={'AUTHOR'}
              onSort={this.onSort}
              activeSortKey={sortKey}>
                Author
            </Sort>
          </span>
          <span style={{ width: '10%' }}>
            <Sort
              sortKey={'COMMENTS'}
              onSort={this.onSort}
              activeSortKey={sortKey}>
               Comments
            </Sort>
          </span>
          <span style={{ width: '10%' }}>
            <Sort
              sortKey={'POINTS'}
              onSort={this.onSort}
              activeSortKey={sortKey}>
              Points
            </Sort>
          </span>
          <span style={{ width: '10%' }}>
            Archive
          </span>
        </div>
        { reverseSortedList.map((item) =>
          <div key={item.objectID} className="table-row">
            <span style={{
                width: '40%'
            }}>
                <a href={item.url}>{item.title}</a>
            </span>
            <span style={{
                width: '30%'
            }}>
                {item.author}
            </span>
            <span style={{
                width: '10%'
            }}>
                {item.num_comments}
            </span>
            <span style={{
                width: '10%'
            }}>
                {item.points}
            </span>
            <span style={{
                width: '10%'
            }}>
                <Button onClick={() => onDismiss(item.objectID)} className="button-inline">
                    Dismiss
                </Button>
            </span>
        </div>)}
      </div>
    );
  }
}

Table.propTypes = {
    list: PropTypes.arrayOf(
      PropTypes.shape({
        objectID: PropTypes.string.isRequired,
        author: PropTypes.string,
        url: PropTypes.string,
        num_comments: PropTypes.number,
        points: PropTypes.number})).isRequired,
    onDismiss: PropTypes.func.isRequired
  }

const Button = ({ onClick, className, children}) =>

  <button onClick={onClick} className={className} type="button">
    {children}
  </button>

Button.propTypes = {
    onClick: PropTypes.func.isRequired,
    className: PropTypes.string,
    children: PropTypes.node.isRequired,
}

Button.defaultProps = {
    className: '',
}

const Loading = () =>
  <div>Loading ... </div>

const withLoading = (Component) => ({ isLoading, ...rest }) =>
  isLoading ? <Loading /> : <Component { ...rest } />

const ButtonWithLoading = withLoading(Button);

const Sort = ({ sortKey, activeSortKey, onSort, children }) =>
  {
    //using the classnames tiny library
    const sortClass = classNames(
      'button-inline',
      { 'button-active': sortKey === activeSortKey }
    );

    return (
      <Button
        onClick={() => onSort(sortKey )}
        className={sortClass}>
        {children}
      </Button>
    );
  }

export default App;

export {
  Button,
  Search,
  Table,
};
