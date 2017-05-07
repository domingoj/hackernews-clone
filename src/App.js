import React, {Component, PropTypes} from 'react';
import './App.css';

const DEFAULT_QUERY = 'redux';
const DEFAULT_PAGE = 0;
const DEFAULT_HPP = '100';

const PATH_BASE = 'https://hn.algolia.com/api/v1';
const PATH_SEARCH = '/search';
const PARAM_SEARCH = 'query=';
const PARAM_PAGE = 'page=';
const PARAM_HPP = 'hitsPerPage=';

class App extends Component {

    constructor(props) {
        super(props);

        this.state = {
            results: null,
            searchKey: '',
            searchTerm: DEFAULT_QUERY
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
        const {searchKey, results} = this.state;

        const oldHits = results && results[searchKey]
            ? results[searchKey].hits
            : [];

        const updatedHits = [
            ...oldHits,
            ...hits
        ];

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

    fetchSearchTopstories(searchTerm, page) {
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

        const {searchTerm, results, searchKey} = this.state;
        const page = (results && results[searchKey] && results[searchKey].page) || 0;
        const list = (results && results[searchKey] && results[searchKey].hits) || [];

        return (
            <div className="page">
                <div className="interactions">
                    <Search value={searchTerm} onChange={this.onSearchChange} onSubmit={this.onSearchSubmit}>
                        Search
                    </Search>
                </div>

                <Table list={list} onDismiss={this.onDismiss}/>

                <div className="interactions">
                    <Button onClick={() => this.fetchSearchTopstories(searchKey, page + 1)}>
                        More
                    </Button>
                </div>
            </div>
        );
    }
}

const Search = ({value, onChange, onSubmit, children}) =>

  <form onSubmit={onSubmit}>
    <input type="text" value={value} onChange={onChange}/>
    <button type="submit">
        {children}
    </button>
  </form>

Search.propTypes = {
    value: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired,
    children: PropTypes.node.isRequired
  };

const Table = ({list, onDismiss}) =>

  <div className="table">
    {list.map((item) => <div key={item.objectID} className="table-row">
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
    children: PropTypes.node.isRequired
}

Button.defaultProps = {
    className: ''
}

export default App;

export {
  Button,
  Search,
  Table,
};
