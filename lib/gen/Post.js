"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
var DBModel_1 = require("../DBModel");
var Post = /** @class */ (function (_super) {
    __extends(Post, _super);
    function Post(fields) {
        var _this = _super.call(this, fields) || this;
        if (fields) {
            _this.props = fields;
        }
        else {
            _this.props = {
                id: 0,
                title: '',
                author: '',
                body: '',
                likes: 0
            };
        }
        return _this;
    }
    Post.prototype.getId = function () {
        return this.props.id;
    };
    Post.prototype.getTitle = function () {
        return this.props.title;
    };
    Post.prototype.getAuthor = function () {
        return this.props.author;
    };
    Post.prototype.getBody = function () {
        return this.props.body;
    };
    Post.prototype.getLikes = function () {
        return this.props.likes;
    };
    Post.prototype.setId = function (value) {
        this.props.id = value;
        return this;
    };
    Post.prototype.setTitle = function (value) {
        this.props.title = value;
        return this;
    };
    Post.prototype.setAuthor = function (value) {
        this.props.author = value;
        return this;
    };
    Post.prototype.setBody = function (value) {
        this.props.body = value;
        return this;
    };
    Post.prototype.setLikes = function (value) {
        this.props.likes = value;
        return this;
    };
    return Post;
}(DBModel_1.DBModel));
exports.Post = Post;
